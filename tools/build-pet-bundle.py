import pathlib,json,hashlib,zipfile,re,sys
def build(source,metadata,output):
 source=pathlib.Path(source);output=pathlib.Path(output)
 snapshot=json.loads(pathlib.Path(metadata).read_text(encoding="utf-8-sig"))
 models=snapshot["models"]
 if len(models)!=284:raise ValueError("Use approved 284-model GUI inventory; server blueprints and additional vanilla sets are outside scope")
 expected={pathlib.PurePosixPath(m["path"]).name for m in models}
 actual={p.name for p in source.glob("*.bbmodel")}
 if actual!=expected:raise ValueError("Model IDs differ from approved GUI inventory: missing="+str(len(expected-actual))+" extra="+str(len(actual-expected)))
 if output.exists():raise ValueError("Output must not already exist")
 for m in models:
  if not re.fullmatch(r"models/[a-zA-Z0-9_-]+\.bbmodel",m["path"]):raise ValueError("Unsafe model path")
  f=source/pathlib.PurePosixPath(m["path"]).name
  if f.is_symlink():raise ValueError("Model source symlink rejected")
  raw=f.read_bytes()
  if len(raw)!=m["bytes"] or hashlib.sha256(raw).hexdigest()!=m["sha256"]:raise ValueError("Approved model hash mismatch: "+m["path"])
 output.parent.mkdir(parents=True,exist_ok=True)
 with zipfile.ZipFile(output,"x",compression=zipfile.ZIP_DEFLATED,compresslevel=6) as bundle:
  bundle.writestr("manifest.json",json.dumps({"formatVersion":1,"models":models},separators=(",",":")))
  for m in models:bundle.write(source/pathlib.PurePosixPath(m["path"]).name,m["path"])
 print(json.dumps({"models":len(models),"bytes":output.stat().st_size,"sha256":hashlib.sha256(output.read_bytes()).hexdigest()}))
if __name__=="__main__":
 try:
  if len(sys.argv)!=4:raise ValueError("Usage: build-pet-bundle.py SOURCE_MODELS APPROVED_METADATA OUTPUT_ZIP")
  build(*sys.argv[1:])
 except (ValueError,KeyError,OSError) as error:print("Bundle blocked:",error,file=sys.stderr);sys.exit(1)
