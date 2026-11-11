/* Current-page reading support. Unfilled cloze answers are never supplied. */
let teacherVoiceEnabled=false;
function bindTeacherVoice(){
bindScreenTools();
if($('teacherVoiceBtn'))return;const host=!state?document.querySelector('.landing-footer'):state.stage==='bike'?document.querySelector('.top-info'):document.querySelector('.view-tabs');
if(!host||state?.done)return;host.insertAdjacentHTML(!state?'afterbegin':'beforeend','<button type="button" id="teacherVoiceBtn" class="teacher-voice-entry" aria-label="Teacher voice settings, currently '+(teacherVoiceEnabled?'enabled':'disabled')+'">🔒 Voice: '+(teacherVoiceEnabled?'on':'off')+'</button>');$('teacherVoiceBtn').onclick=openTeacherVoice;
}
function openTeacherVoice(){
stopNarration();let dialog=$('teacherVoiceDialog');if(!dialog){dialog=document.createElement('dialog');dialog.id='teacherVoiceDialog';dialog.setAttribute('aria-label','Teacher voice settings');document.body.append(dialog)}
dialog.innerHTML='<div class="dialog-head"><h2>Teacher voice settings</h2><button type="button" id="closeTeacherVoice" class="quiet">Close ×</button></div><p>Read-aloud is '+(teacherVoiceEnabled?'on':'off')+'. Enter the teacher code to change it.</p><form id="voiceCodeForm"><label for="voiceTeacherCode">Teacher code</label><input id="voiceTeacherCode" type="password" inputmode="numeric" autocomplete="off" maxlength="3"><button type="submit" class="primary">Unlock settings</button><p id="voiceCodeStatus" role="status"></p></form><div id="teacherVoiceChoices" hidden><button type="button" id="enableTeacherVoice" class="primary">Enable voice</button><button type="button" id="disableTeacherVoice" class="quiet">Disable voice</button><p>Voice starts off whenever the activity is reopened or reset for another student.</p></div>';
$('closeTeacherVoice').onclick=()=>dialog.close();$('voiceCodeForm').onsubmit=e=>{e.preventDefault();if($('voiceTeacherCode').value!=='259'){$('voiceCodeStatus').textContent='Please ask your teacher to enter the code.';$('voiceTeacherCode').value='';return}$('voiceCodeForm').hidden=true;$('teacherVoiceChoices').hidden=false};
const setVoice=enabled=>{teacherVoiceEnabled=enabled;stopNarration();dialog.close();if(state){navpush('teacher_voice',enabled?'enabled':'disabled');render()}else{const id=$('studentId')?.value;landing();if(id)$('studentId').value=id}};
$('enableTeacherVoice').onclick=()=>setVoice(true);$('disableTeacherVoice').onclick=()=>setVoice(false);dialog.showModal();$('voiceTeacherCode').focus();
}
function childText(text,level){
const value=String(text);if(level!=='A')return escapeHTML(value);
let html='',at=0;const words=/[A-Za-z]+(?:[’'][A-Za-z]+)?/g;let match;
while((match=words.exec(value))){html+=escapeHTML(value.slice(at,match.index));const word=match[0],blend=/^(scr|spl|spr|squ|str|bl|br|cl|cr|dr|fl|fr|gl|gr|pl|pr|sc|sk|sl|sm|sn|sp|st|sw|tr|tw)(?=[a-z])/i.exec(word);html+=blend?'<mark class="initial-blend">'+escapeHTML(blend[0])+'</mark>'+escapeHTML(word.slice(blend[0].length)):escapeHTML(word);at=match.index+word.length}
return html+escapeHTML(value.slice(at));
}
const storyReference={scope:'',side:{compact:false,part:0},dialog:{compact:false,part:0}};
function referenceScope(){
const scope=state.level+'|'+state.sid+'|'+state.p;if(storyReference.scope!==scope){storyReference.scope=scope;storyReference.side={compact:false,part:0};storyReference.dialog={compact:false,part:0}}
}
function referenceWords(text){
const section=LEVELS[state.level].sections[state.p],answers=state.answers[state.p]||{};
return String(text).split(/(\{\{c\d+\}\})/).map(piece=>{const id=/^\{\{(c\d+)\}\}$/.exec(piece)?.[1];if(!id)return childText(piece,state.level);const choice=clozeChoice(section,answers[id]);return '<span class="reference-blank">'+(choice?childText(choice.word,state.level):'____')+'</span>'}).join('');
}
function referenceMarkup(mode){
referenceScope();const section=LEVELS[state.level].sections[state.p],settings=storyReference[mode],parts=section.cloze.parts;
settings.part=Math.min(settings.part,parts.length-1);
const paragraphs=settings.compact?parts[settings.part].split('\n\n'):section.cloze.paragraphs;
return '<div class="reference-heading"><span class="eyebrow">STORY '+(state.p+1)+' TEXT</span><h3>'+escapeHTML(sectionTitle(state.level,state.p))+'</h3><p>Look in this page’s story for your answers.</p></div><div class="reference-reading '+(settings.compact?'':'reference-full')+'">'+paragraphs.map(text=>'<p>'+referenceWords(text)+'</p>').join('')+'</div>'+(settings.compact?'<div class="reference-parts"><button type="button" class="page-step" data-reference-part="-1" aria-label="Back to previous part of this story text" '+(settings.part===0?'disabled':'')+'>← Back</button><span>Text part '+(settings.part+1)+' / '+parts.length+'</span><button type="button" class="page-step" data-reference-part="1" aria-label="Next part of this story text" '+(settings.part===parts.length-1?'disabled':'')+'>Next →</button></div>':'')+(mode==='dialog'&&hasNarration(state.level)?'<div class="reference-voice"><button type="button" id="listenReference">▶ Read text</button><button type="button" id="stopReference">■ Stop</button><label>Speed <select id="referenceSpeed" aria-label="Text reading speed">'+narrationRates.map(([rate,label])=>'<option value="'+rate+'" '+(rate===narration.rate?'selected':'')+'>'+label+'</option>').join('')+'</select></label></div>':'');
}
function mountStoryReference(mode){
const host=$(mode==='side'?'textReferenceSide':'textReferenceDialog');if(!host||!state||state.stage==='bike'||state.done)return;
host.innerHTML=referenceMarkup(mode);
host.querySelectorAll('[data-reference-part]').forEach(button=>button.onclick=()=>{stopNarration();storyReference[mode].part+=Number(button.dataset.referencePart);mountStoryReference(mode)});
const reading=host.querySelector('.reference-reading');
if(host.clientHeight>0){let size=parseFloat(getComputedStyle(reading).fontSize),minimum=state.level==='Pre-A'?23:state.level==='A'?22:18;while(reading.scrollHeight>reading.clientHeight+2&&size>minimum){size=Math.max(minimum,size-.5);reading.style.fontSize=size+'px'}if(reading.scrollHeight>reading.clientHeight+2){reading.style.lineHeight='1.32';reading.style.setProperty('--reference-gap','9px')}}
if(!storyReference[mode].compact&&host.clientHeight>0&&reading.scrollHeight>reading.clientHeight+2&&state.level!=='A'&&state.level!=='Pre-A'){storyReference[mode].compact=true;mountStoryReference(mode);return}
if(mode==='dialog'&&hasNarration(state.level)){
$('listenReference').onclick=()=>{stopNarration(false);if(!narrationAvailable())return;const section=LEVELS[state.level].sections[state.p],settings=storyReference.dialog,text=settings.compact?section.cloze.parts[settings.part]:section.cloze.paragraphs.join(' ');narration.target='story text';narration.parts=[text.replace(/\{\{(c\d+)\}\}/g,(_,id)=>clozeChoice(section,state.answers[state.p]?.[id])?.word||'blank '+(Number(id.slice(1))+1))];narration.index=0;narration.running=true;narration.started=false;narration.error=false;speakNarrationPart(narration.token)};
$('stopReference').onclick=()=>stopNarration();$('referenceSpeed').onchange=e=>changeNarrationSpeed(e.target.value);
}
}
function openStoryReference(){
if(!state||state.done||state.stage==='bike'||syncLatest())return;stopNarration();let dialog=$('storyReferenceDialog');
if(!dialog){dialog=document.createElement('dialog');dialog.id='storyReferenceDialog';dialog.setAttribute('aria-label','Read the current story page');document.body.append(dialog)}
dialog.className='grade-'+state.level;dialog.innerHTML='<div class="dialog-head"><h2>Read this page</h2><button type="button" id="closeStoryReference" class="quiet">Back to questions ×</button></div><div id="textReferenceDialog" class="reference-content"></div>';
dialog.onclose=()=>stopNarration();$('closeStoryReference').onclick=()=>dialog.close();dialog.showModal();mountStoryReference('dialog');navpush('read_current_text',state.p+1);
}
function bindStoryReference(){if($('openStoryReference'))$('openStoryReference').onclick=openStoryReference;if(view==='questions')mountStoryReference('side')}
