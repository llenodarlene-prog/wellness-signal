import fs from "node:fs";import {readJson,parseFrontMatter} from "./lib.mjs";
const site=readJson("data/site.json"),release=readJson("data/release.json"),plan=readJson("data/content-plan.json"),errors=[];
if(site.launch_status!=="ready")errors.push("launch_status must be ready.");
if(!site.contact_email)errors.push("contact_email must be set.");
if(!site.publisher)errors.push("publisher must be set.");
for(const [k,v] of Object.entries(release.approvals))if(v!==true)errors.push("approval "+k+" must be true");
for(const route of release.core_routes){const file=route==="/"? "content/pages/home.md":"content/pages/"+route.slice(1,-1)+".md";if(!fs.existsSync(file)){errors.push("Missing core route file "+route);continue}const parsed=parseFrontMatter(fs.readFileSync(file,"utf8"));if(parsed.data.complete!==true)errors.push("Core route incomplete: "+route);if(/not yet|before launch|will be|placeholder/i.test(parsed.body))errors.push("Core route marked complete but contains placeholder language: "+route);}
let blogs=0;for(const p of plan.filter(x=>x.type==="blog")){const parsed=parseFrontMatter(fs.readFileSync("content/posts/"+p.id+".md","utf8"));const r=readJson("content/research/"+p.id+".json");if(parsed.data.draft===false&&r.status==="verified"&&r.fact_check?.status==="approved"&&r.evidence_review?.status==="approved"&&r.qa?.status==="approved")blogs++;}
if(blogs<release.minimum_published_blogs)errors.push("Need at least "+release.minimum_published_blogs+" fully verified published blog.");
if(errors.length){console.error("Production release blocked:\n- "+errors.join("\n- "));process.exit(1)}console.log("Production release gate passed.");
