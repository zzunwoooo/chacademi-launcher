import json,pathlib,hashlib,re,sys,urllib.parse
ROOT=pathlib.Path(__file__).resolve().parents[2]
ROLES={'final-hud','final-bridge','magiccodex','portablevfx','resourcepack','pets-models','custom-vfx','options','mod-config','shader'}
DENY=re.compile(r'(^|/)(logs?|screenshots|chatlogs|saves|world.*|playerdata|journeymap|waypoints|\.ssh|authme.jsonc|chzzk.json|sodium-fingerprint.json|servers.dat.*|config.json|usercache.json|server.properties|velocity.toml|.*\.(key|pem|pfx|bak))(/|$)',re.I)
def require(ok,msg):
 if not ok: raise ValueError(msg)
def main(inp,payload,out):
 d=json.loads(pathlib.Path(inp).read_text(encoding='utf-8-sig'))
 require(d.get('finalIntegrationApproved') is True,'Final integration not approved')
 require(re.fullmatch('[a-f0-9]{40}',d.get('sourceCommit','')),'Full final source SHA required')
 require(d.get('serverAddress')=='스트리머.온라인.한국','Server must match verified distribution')
 require(d.get('microsoftClientIdAuthorized') is True and re.fullmatch('[a-fA-F0-9-]{36}',d.get('microsoftClientId','')),'Authorized Microsoft client ID required')
 bg=ROOT/'source/app/assets/images/backgrounds/chacademi-background.png'
 require(d.get('backgroundApproved') is True and bg.is_file(),'New Chacademi background not approved')
 require(hashlib.sha256(bg.read_bytes()).hexdigest()==d.get('backgroundSha256'),'Background SHA256 mismatch')
 require(bg.read_bytes().startswith(bytes([137,80,78,71,13,10,26,10])),'Background must be a PNG')
 assets=d.get('assets',[])
 require(ROLES<={a.get('role') for a in assets},'Required final HUD/Bridge/assets missing')
 inventory=json.loads((ROOT/'mod-inventory.json').read_text(encoding='utf-8-sig'))
 require({m['id'] for m in inventory if not m['excluded']}<={a.get('modId') for a in assets},'Retained mod missing; exclude only Axiom')
 distro=json.loads((ROOT/'distribution-reviewed.json').read_text(encoding='utf-8-sig'))
 server=distro['servers'][0];server.update(name='차카데미',autoconnect=True,mainServer=True)
 fabric=d.get('fabricModule')
 require(fabric and fabric.get('type')=='Fabric','Official verified Fabric module required')
 def official(m):
  u=urllib.parse.urlsplit(m.get('artifact',{}).get('url',''))
  require(u.scheme=='https' and u.hostname in {'maven.fabricmc.net','libraries.minecraft.net','raw.githubusercontent.com'} and not u.query and not u.username,'Unapproved Fabric library origin')
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
  raw=f.read_bytes();sha=hashlib.sha256(raw).hexdigest();require(sha==a['sha256'],'SHA256 mismatch: '+rel)
  if f.suffix in {'.json','.jsonc','.toml','.properties','.txt','.yml','.yaml'}:
   require(not re.search(rb'(?i)(access.?token|refresh.?token|client.?secret|password|forwarding.?secret|private.?key)\s*[" ]*[:=]',raw),'Sensitive field detected')
  art={'size':len(raw),'MD5':hashlib.md5(raw).hexdigest(),'url':a['url']}
  typ='FabricMod' if a.get('modId') else 'File';mid=a.get('id',rel)
  if typ=='FabricMod':require(mid.endswith('@jar'),'Maven mod ID ending @jar required')
  else:art['path']=rel
  server['modules'].append({'id':mid,'name':a.get('name',rel),'type':typ,'artifact':art})
  checks.append({'path':rel,'sha256':sha,'url':a['url'],'license':a['license'],'role':a['role']})
 out=pathlib.Path(out);require(not out.exists() or not any(out.iterdir()),'Output must be empty');out.mkdir(parents=True,exist_ok=True)
 for name,data in [('distribution.json',distro),('payload-sha256.json',{'sourceCommit':d['sourceCommit'],'assets':checks})]:
  (out/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print('Final distribution prepared:',len(assets),'assets')
if __name__=='__main__':
 try:
  require(len(sys.argv)==4,'Usage: build-distribution.py INPUT PAYLOAD OUTPUT');main(*sys.argv[1:])
 except (ValueError,KeyError,OSError) as e:print('Release blocked:',e,file=sys.stderr);sys.exit(1)
