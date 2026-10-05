import json,pathlib,hashlib,re,sys,urllib.parse,zipfile
ROOT=pathlib.Path(__file__).resolve().parents[2]
ROLES={'magiccodex','portablevfx','resourcepack','pets-models-bundle','custom-vfx','client-assets-bundle','options','mod-config','shader'}
DENY=re.compile(r'(^|/)(logs?|screenshots|chatlogs|saves|world.*|playerdata|journeymap|waypoints|\.ssh|authme.jsonc|chzzk.json|sodium-fingerprint.json|servers.dat.*|config.json|usercache.json|server.properties|velocity.toml|.*\.(key|pem|pfx|bak))(/|$)',re.I)
def require(ok,msg):
 if not ok: raise ValueError(msg)
def main(inp,payload,out):
 d=json.loads(pathlib.Path(inp).read_text(encoding='utf-8-sig'))
 require(d.get('finalIntegrationApproved') is True,'Final integration not approved')
 require(re.fullmatch('[a-f0-9]{40}',d.get('sourceCommit','')),'Full final source SHA required')
 require(d.get('serverAddress')=='\uc2a4\ud2b8\ub9ac\uba38.\uc628\ub77c\uc778.\ud55c\uad6d','Server must match verified distribution')
 require(d.get('microsoftClientIdAuthorized') is True and re.fullmatch('[a-fA-F0-9-]{36}',d.get('microsoftClientId','')),'Authorized Microsoft client ID required')
 require(d.get('backgroundMode')=='blank','This release uses the approved blank background')
 require(d.get('modelPolicy')=='bbmodel-bundle' and d.get('modelClientDistributionApproved') is True,'Approved client bbmodel bundle policy required')
 components=d.get('integrationComponents',{})
 for key in ['hudSha256','bridgeSha256']:
  require(re.fullmatch('[a-f0-9]{64}',components.get(key,'')),'Final HUD/Bridge hashes must be frozen')
 assets=d.get('assets',[])
 require(any(a.get('modId')=='magiccodex' and a.get('sha256')==components['hudSha256'] for a in assets),'Final HUD hash must match the client Magic Codex artifact')

 for a in assets:
  if a.get('path','').lower().endswith('.bbmodel') or a.get('role')=='pets-models':
   require(False,'Individual bbmodel artifacts are excluded; use the separate approved ZIP')

 require((ROLES-{'resourcepack','custom-vfx'})<={a.get('role') for a in assets},'Required final HUD/Bridge/assets missing')
 inventory=json.loads((ROOT/'mod-inventory.json').read_text(encoding='utf-8-sig'))
 require({m['id'] for m in inventory if not m['excluded']}<={a.get('modId') for a in assets},'Retained mod missing; exclude only Axiom')
 distro=json.loads((ROOT/'distribution-reviewed.json').read_text(encoding='utf-8-sig'))
 server=distro['servers'][0];server.update(name='\ucc28\uce74\ub370\ubbf8',autoconnect=True,mainServer=True)
 distro['rss']=None;distro.pop('discord',None);server.pop('discord',None)
 fabric=d.get('fabricModule')
 require(fabric and fabric.get('type')=='Fabric','Official verified Fabric module required')
 def official(m):
  u=urllib.parse.urlsplit(m.get('artifact',{}).get('url',''))
  require(u.scheme=='https' and u.hostname in {'maven.fabricmc.net','meta.fabricmc.net','libraries.minecraft.net','raw.githubusercontent.com'} and not u.query and not u.username,'Unapproved Fabric library origin')
  require('mchdistro' not in u.path,'Inherited library mirror prohibited')
  require(re.fullmatch('[a-fA-F0-9]{32}',m['artifact'].get('MD5','')),'Fabric artifact hash required')
  for c in m.get('subModules',[]):official(c)
 official(fabric);server['modules']=[fabric]
 payload=pathlib.Path(payload).resolve();seen=set();checks=[]
 for a in assets:
  rel=a['path'];p=pathlib.PurePosixPath(rel)
  require(not p.is_absolute() and '..' not in p.parts and '\\' not in rel and ':' not in rel and not DENY.search(rel),'Excluded or unsafe asset path')
  require(rel=='options.txt' or rel.startswith(('config/','resourcepacks/','shaderpacks/','mods/')),'Asset outside allowlist')
  require(rel not in seen,'Duplicate asset path');seen.add(rel)
  require(a.get('modId')!='axiom','Axiom excluded')
  u=urllib.parse.urlsplit(a['url'])
  require(u.scheme=='https' and u.hostname and not u.username and not u.password and not u.query and not u.fragment and a.get('downloadAuthorized') is True,'Authorized credential-free HTTPS URL required')
  f=(payload/pathlib.Path(*p.parts)).resolve();require(f.is_relative_to(payload) and f.is_file(),'Missing asset or payload traversal')
  if a.get('role')=='client-assets-bundle':
   require(rel=='config/magiccodex/launcher/client-assets.zip' and a.get('id')=='chacademi-client-assets.zip','Client asset bundle contract invalid')
   with zipfile.ZipFile(f) as pack:
    manifest=json.loads(pack.read('manifest.json'));names={'manifest.json'};prefixes=set();total=0
    require(0<len(manifest['files'])<=2000,'Client asset count invalid')
    for item in manifest['files']:
     name=item['path'];parts=pathlib.PurePosixPath(name)
     require(not parts.is_absolute() and '..' not in parts.parts and '\\' not in name and ':' not in name and name not in names,'Unsafe client asset member')
     prefix=next((x for x in ['resourcepacks/chacademia-spells/','config/portablevfx/effects/'] if name.startswith(x)),None)
     require(prefix is not None,'Unapproved client asset destination');prefixes.add(prefix);names.add(name)
     raw=pack.read(name);total+=len(raw)
     require(len(raw)==item['bytes'] and hashlib.sha256(raw).hexdigest()==item['sha256'],'Client asset member hash mismatch')
     if parts.suffix.lower() in {'.json','.json5','.jsonc','.properties','.toml','.txt','.yml','.yaml'}:
      require(not re.search(rb'(?i)(access.?token|refresh.?token|client.?secret|password|forwarding.?secret|private.?key)\s*[" ]*[:=]',raw),'Sensitive client asset field')
    require(len(prefixes)==2 and total<=1024*1024*1024 and len(pack.namelist())==len(names) and set(pack.namelist())==names,'Client asset bundle incomplete or unexpected members')
  if a.get('role')=='pets-models-bundle':
   require(rel=='config/magiccodex/pets/pets-models.zip' and a.get('id')=='chacademi-pet-models.zip','Pet bundle destination or module ID invalid')
   with zipfile.ZipFile(f) as pack:
    manifest=json.loads(pack.read('manifest.json'))
    require(len(manifest['models'])==284,'GUI bundle must contain the approved 284 models, not server blueprints or additional vanilla models')
    names=set()
    for m in manifest['models']:
     require(re.fullmatch(r'models/[a-zA-Z0-9_-]+\.bbmodel',m['path']) and m['path'] not in names,'Unsafe or duplicate model path')
     names.add(m['path'])
     body=pack.read(m['path'])
     require(len(body)==m['bytes'] and hashlib.sha256(body).hexdigest()==m['sha256'],'Pet model payload hash mismatch')
    require(set(pack.namelist())<=(names|{'manifest.json','models/'}),'Unexpected files in pet model bundle')
  raw=f.read_bytes();sha=hashlib.sha256(raw).hexdigest();require(sha==a['sha256'],'SHA256 mismatch: '+rel)
  if f.suffix in {'.json','.jsonc','.toml','.properties','.txt','.yml','.yaml'}:
   require(not re.search(rb'(?i)(access.?token|refresh.?token|client.?secret|password|forwarding.?secret|private.?key)\s*[" ]*[:=]',raw),'Sensitive field detected')
  policy=a.get('updatePolicy')
  personal=rel=='options.txt' or rel.startswith('config/') and not rel.endswith('pets-models.zip') or rel.endswith('.zip.txt')
  require(not personal or policy in {'seed','managed'},'Configuration update policy required')
  require(policy!='managed' or bool(a.get('managedReason')),'Managed configuration reason required')
  art={'size':len(raw),'MD5':hashlib.md5(raw).hexdigest(),'SHA256':sha,'url':a['url']}
  typ='FabricMod' if a.get('modId') else 'File';mid=a.get('id',rel)
  if typ=='FabricMod':require(mid.endswith('@jar'),'Maven mod ID ending @jar required')
  else:art['path']=rel
  server['modules'].append({'id':mid,'name':a.get('name',rel),'type':typ,'artifact':art,**({'updatePolicy':policy} if policy else {})})
  checks.append({'path':rel,'sha256':sha,'url':a['url'],'license':a['license'],'role':a['role']})
 out=pathlib.Path(out);require(not out.exists() or not any(out.iterdir()),'Output must be empty');out.mkdir(parents=True,exist_ok=True)
 for name,data in [('distribution.json',distro),('payload-sha256.json',{'sourceCommit':d['sourceCommit'],'integrationComponents':components,'backgroundMode':'blank','modelPolicy':d['modelPolicy'],'petModelStatus':'approved separate ZIP installed before launch; existing renderer unchanged','assets':checks})]:
  (out/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print('Final distribution prepared:',len(assets),'assets')
if __name__=='__main__':
 try:
  require(len(sys.argv)==4,'Usage: build-distribution.py INPUT PAYLOAD OUTPUT');main(*sys.argv[1:])
 except (ValueError,KeyError,OSError,zipfile.BadZipFile) as e:print('Release blocked:',e,file=sys.stderr);sys.exit(1)
