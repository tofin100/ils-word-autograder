export async function extractBlueAnswersFromDocx(file, JSZipLib) {
  const JSZip = JSZipLib || window.JSZip;
  if (!JSZip) throw new Error("JSZip nicht gefunden");

  const buf = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buf);

  const docXmlFile = zip.file("word/document.xml");
  if (!docXmlFile) throw new Error("word/document.xml fehlt – ist das wirklich .docx?");

  const xml = await docXmlFile.async("string");
  const doc = new DOMParser().parseFromString(xml, "text/xml");

  const runs = [...doc.getElementsByTagName("w:r")];

  // echte Hex-Blauwerte
  const BLUE_HEX = new Set(["0000FF","0070C0","2F75B5","1F4E79","2E74B5","305496"]);
  // Theme-Blau (Word nutzt oft themeColor="accent1")
  const BLUE_THEME = new Set(["ACCENT1","ACCENT2","HYPERLINK","FOLLOWEDHYPERLINK"]);

  const runText = r => [...r.getElementsByTagName("w:t")].map(x => x.textContent).join("");

  const runIsBlue = (r) => {
    const rPr = r.getElementsByTagName("w:rPr")[0];
    if(!rPr) return false;

    const color = rPr.getElementsByTagName("w:color")[0];
    if(!color) return false;

    const val = (color.getAttribute("w:val") || color.getAttribute("val") || "").toUpperCase().replace("#","");
    const theme = (color.getAttribute("w:themeColor") || color.getAttribute("themeColor") || "").toUpperCase();

    if(val && BLUE_HEX.has(val)) return true;
    if(theme && BLUE_THEME.has(theme)) return true;

    return false;
  };

  let raw = [];
  let cur = "";

  for(const r of runs){
    if(runIsBlue(r)){
      cur += runText(r);
    } else {
      if(cur.trim()){
        raw.push(cur.trim());
        cur = "";
      }
    }
  }
  if(cur.trim()) raw.push(cur.trim());

  // Merge "s"/"es"/"a"/"b" Split-Fragmente
  const merged=[];
  let frag="";
  for(const t of raw){
    if(t.length <= 2){
      frag += t;
      continue;
    }
    if(frag){
      merged.push((frag + " " + t).trim());
      frag="";
    } else {
      merged.push(t.trim());
    }
  }
  if(frag) merged.push(frag);

  return merged;
}