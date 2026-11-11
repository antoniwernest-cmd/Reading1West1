/* Storage, narration, assessment and workbook helpers reused from the classroom reader. */
function createAttemptStorage(browser){
const memory=new Map();let backend=null,mode='memory';
for(const name of ['localStorage','sessionStorage']){
try{const candidate=browser[name],probe=CAT_NAME+'_storage_probe';candidate.setItem(probe,'1');candidate.removeItem(probe);backend=candidate;mode=name==='localStorage'?'local':'session';break}catch{}
}
return {
get mode(){return mode},
getItem(key){if(backend){try{const value=backend.getItem(key);if(value===null)memory.delete(key);else memory.set(key,value);return value}catch{backend=null;mode='memory'}}return memory.get(key)??null},
setItem(key,value){memory.set(key,value);if(backend){try{backend.setItem(key,value)}catch{backend=null;mode='memory'}}},
removeItem(key){memory.delete(key);if(backend){try{backend.removeItem(key)}catch{backend=null;mode='memory'}}}
};
}
const narration={rate:.85,token:0,running:false,started:false,index:0,parts:[],utterance:null,target:'story',message:'Ready to listen.',error:false};
const narrationRates=[[.7,'Slow'],[.85,'Steady'],[1,'Normal'],[1.2,'Fast']];
function narrationAvailable(){return 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance==='function'}
function narrationTarget(){if(state?.stage==='bike')return 'bike';return view==='questions'?'questions':'story'}
function narrationControls(){
return '<div class="narration-bar" role="group" aria-label="Read aloud"><button type="button" id="readAloud" aria-label="Read '+narrationTarget()+' aloud">▶ Read '+narrationTarget()+'</button><button type="button" id="stopAloud" disabled aria-label="Stop reading aloud">■ Stop</button><label class="voice-speed" for="readSpeed">Speed <select id="readSpeed" aria-label="Reading speed">'+narrationRates.map(([rate,label])=>'<option value="'+rate+'" '+(narration.rate===rate?'selected':'')+'>'+label+' ('+rate+'×)</option>').join('')+'</select></label><span class="voice-status" id="voiceStatus" role="status" aria-live="polite"></span></div>';
}
function updateNarration(){
const play=$('readAloud');if(!play)return;
play.textContent=narration.running?'🔊 Reading…':'▶ Read '+narrationTarget();
play.disabled=narration.running||!narrationAvailable();
play.setAttribute('aria-label','Read '+narrationTarget()+' aloud');
$('stopAloud').disabled=!narration.running;
$('readSpeed').value=String(narration.rate);
$('voiceStatus').textContent=narration.message;
play.closest('.narration-bar').dataset.error=String(narration.error);
}
function stopNarration(update=true){
narration.token++;narration.running=false;narration.started=false;narration.utterance=null;
if(narrationAvailable())window.speechSynthesis.cancel();
narration.message='Voice stopped.';narration.error=false;
if(update)updateNarration();
}
function narrationParts(target){
if(target==='bike')return ['Bike notebook. Drag each name to its numbered bike part. You can also tap a name and then its answer pad.','Word bank: '+bikeParts(state.level).map(part=>part.label).join('. ')+'.'];
const section=LEVELS[state.level].sections[state.p];if(target==='story')return ['Chapter '+(state.p+1)+'. '+sectionTitle(state.level,state.p),...clozeReadAloud(section)];
return ['Questions for this chapter.',...section.mc.flatMap((q,i)=>['Question '+(i+1)+'. '+q.prompt,...q.choices.map((c,j)=>'Choice '+(j+1)+'. '+c)]),'Matching.',...section.match.rows.map(([prompt],i)=>'Pair '+(i+1)+'. '+prompt), 'Matching choices: '+section.match.options.join('. ')+'.'];
}
function speakNarrationPart(token){
if(token!==narration.token||!narration.running)return;
if(narration.index>=narration.parts.length){narration.running=false;narration.utterance=null;narration.message='Finished. Press play to hear it again.';updateNarration();return}
const synth=window.speechSynthesis,u=new window.SpeechSynthesisUtterance(narration.parts[narration.index]);
const voices=synth.getVoices().filter(v=>/^en(?:-|_)/i.test(v.lang));
u.voice=voices.find(v=>v.localService&&/^en-CA/i.test(v.lang))||voices.find(v=>v.localService&&v.default)||voices.find(v=>v.localService)||voices.find(v=>/^en-CA/i.test(v.lang))||voices.find(v=>v.default)||voices[0]||null;
u.lang=u.voice?.lang||'en-CA';u.rate=narration.rate;u.pitch=1;u.volume=1;narration.utterance=u;
u.onstart=()=>{if(token!==narration.token)return;narration.started=true;narration.message='Reading '+narration.target+'.';updateNarration()};
u.onend=()=>{if(token!==narration.token)return;narration.index++;speakNarrationPart(token)};
u.onerror=()=>{if(token!==narration.token)return;stopNarration(false);narration.error=true;narration.message='Voice is unavailable. Try Edge or Chrome with an English voice installed.';updateNarration()};
try{if(synth.paused)synth.resume();synth.speak(u)}catch{u.onerror()}
}
function startNarration(){
if(!state||state.done||!hasNarration(state.level))return;
stopNarration(false);
if(!narrationAvailable()){narration.error=true;narration.message='Read-aloud is unavailable in this browser.';updateNarration();return}
if(view==='picture'){view='story';document.querySelector('.workspace').dataset.view=view;document.querySelectorAll('.view-tabs button[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view))}
narration.target=narrationTarget();narration.parts=narrationParts(narration.target);narration.index=0;narration.running=true;narration.started=false;narration.message='Starting voice…';narration.error=false;
const token=narration.token;navpush('read_aloud',narration.target+'; speed='+narration.rate);updateNarration();speakNarrationPart(token);
setTimeout(()=>{if(token===narration.token&&narration.running&&!narration.started){stopNarration(false);narration.error=true;narration.message='The voice did not start. Check that an English voice is installed, then try again.';updateNarration()}},8000);
}
function changeNarrationSpeed(value){
const rate=Number(value);if(!narrationRates.some(([r])=>r===rate))return;
const reading=narration.running,parts=narration.parts,index=narration.index,target=narration.target;
stopNarration(false);narration.rate=rate;if(state){state.voiceRate=rate;navpush('read_aloud_speed',rate)}
narration.message='Speed: '+narrationRates.find(([r])=>r===rate)[1]+'.';
if(reading){narration.parts=parts;narration.index=index;narration.target=target;narration.running=true;narration.message='Reading '+target+'.';speakNarrationPart(narration.token)}
updateNarration();
}
function bindNarration(){
if(!state||!hasNarration(state.level))return;
narration.message=narrationAvailable()?'Choose play to listen.':'Read-aloud is unavailable in this browser.';narration.error=!narrationAvailable();
$('readAloud').onclick=startNarration;
$('stopAloud').onclick=()=>{stopNarration();navpush('read_aloud_stop')};
$('readSpeed').onchange=e=>changeNarrationSpeed(e.target.value);updateNarration();
}

const xmlEscape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function hasNarration(level=state?.level||chosenLevel){return teacherVoiceEnabled===true&&!!LEVELS[level]}
function sectionTitle(level,p){return p===4?'Bike notebook':(LEVELS[level].titles||TITLES)[p]}
function matchingTitle(s){return s.match.rows.length===1?'Make a match':'Match each pair'}
function matchingHelp(s){return s.match.rows.length===s.match.options.length?'Drag each answer to a pad. You can move it again.':'Drag one answer to the pad.'}
function matchingInstruction(s){return matchingTitle(s)+'. '+matchingHelp(s)}
function sectionMaximum(level,p){const s=LEVELS[level].sections[p];return s.mc.length+s.match.rows.length}
function assessmentMaximum(level){return LEVELS[level].sections.reduce((n,s)=>n+s.mc.length+s.match.rows.length,0)}
function answerKeys(s){return [...s.mc.map((_,i)=>'m'+i),...s.match.rows.map((_,i)=>'t'+i)]}
function crc32(a){let c=-1;for(const b of a){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^-1)>>>0}
function zipStored(files){const enc=new TextEncoder(),parts=[],central=[];let offset=0;const put=(size,fn)=>{const a=new Uint8Array(size);fn(new DataView(a.buffer));return a};
for(const [name,value] of Object.entries(files)){const n=enc.encode(name),a=typeof value==='string'?enc.encode(value):value,c=crc32(a),h=put(30,v=>{v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint32(14,c,true);v.setUint32(18,a.length,true);v.setUint32(22,a.length,true);v.setUint16(26,n.length,true)});parts.push(h,n,a);central.push(put(46,v=>{v.setUint32(0,0x02014b50,true);v.setUint16(4,20,true);v.setUint16(6,20,true);v.setUint32(16,c,true);v.setUint32(20,a.length,true);v.setUint32(24,a.length,true);v.setUint16(28,n.length,true);v.setUint32(42,offset,true)}),n);offset+=30+n.length+a.length}
const count=Object.keys(files).length,cs=central.reduce((n,a)=>n+a.length,0),end=put(22,v=>{v.setUint32(0,0x06054b50,true);v.setUint16(8,count,true);v.setUint16(10,count,true);v.setUint32(12,cs,true);v.setUint32(16,offset,true)});return new Blob([...parts,...central,end],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})}
function excelCell(v){return typeof v==='number'?'<c><v>'+v+'</v></c>':'<c t="inlineStr"><is><t xml:space="preserve">'+xmlEscape(v)+'</t></is></c>'}
function replaceSheetData(xml,rows,settings={}){
let data='<sheetData>';
rows.forEach((row,i)=>{
const styleRow=settings[i]?.template||(i>=26?27:i+1),original=new RegExp('<row\\b[^>]*\\br="'+(i+1)+'"[^>]*>').exec(xml),fallback=new RegExp('<row\\b[^>]*\\br="'+styleRow+'"[^>]*>').exec(xml);
let tag=(settings[i]?.template?fallback:original)?.[0]||fallback?.[0]||'<row r="'+(i+1)+'">';tag=tag.replace(/\br="\d+"/,'r="'+(i+1)+'"');
if(settings[i]?.height){tag=tag.replace(/\s(?:ht|customHeight)="[^"]*"/g,'').replace('>',' ht="'+settings[i].height+'" customHeight="1">')}
data+=tag+row.map((value,j)=>{let n=j+1,col='';while(n){col=String.fromCharCode(65+(n-1)%26)+col;n=Math.floor((n-1)/26)}
const reference=col+(settings[i]?.template?styleRow:i+1),old=new RegExp('<c\\b[^>]*\\br="'+reference+'"[^>]*>').exec(xml)||new RegExp('<c\\b[^>]*\\br="'+col+styleRow+'"[^>]*>').exec(xml),style=old?.[0].match(/\bs="(\d+)"/)?.[1];
return excelCell(value).replace('<c','<c r="'+col+(i+1)+'"'+(style?' s="'+style+'"':''))}).join('')+'</row>';
});
return xml.replace(/<sheetData[\s\S]*?<\/sheetData>/,data+'</sheetData>').replace(/<dimension ref="([A-Z]+\d+):([A-Z]+)\d+"\s*\/>/,'<dimension ref="$1:$2'+rows.length+'"/>');
}
function optionsText(row){
return row.options.map((c,i)=>String.fromCharCode(65+i)+'. '+c).join(row.options.length>5?'   ':'\n');
}
function createExcelFiles(r){return extendedExcelFiles(r)}
