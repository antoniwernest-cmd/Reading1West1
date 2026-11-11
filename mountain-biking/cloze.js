/* Shared cloze controls: pointer dragging, touch placement and keyboard access. */
let selectedClozeWord=null,clozeScope='',clozeDrag=null,clozeCompact=false,clozeEventsBound=false,clozeClickGuard=null;
function clozeChoice(section,token){return section.cloze?.bank.find(word=>word.id===token)}
function clozeCount(section,answers={}){return (section.cloze?.blanks||[]).filter(blank=>clozeChoice(section,answers[blank.id])).length}
function clozePart(section){return Math.min(Math.max(0,state.readParts?.[state.p]||0),clozeDisplayParts(section).length-1)}
function clozeBlankButton(blank,answers,pad=false){const choice=clozeChoice(LEVELS[state.level].sections[state.p],answers[blank.id]),number=Number(blank.id.slice(1))+1;return '<button type="button" draggable="false" class="cloze-blank '+(choice?'filled':'')+'" data-blank="'+blank.id+'" data-token="'+(choice?.id||'')+'" aria-label="'+(pad?'Answer pad ':'Blank ')+number+': '+escapeHTML(choice?.word||'empty')+'">'+('<span>'+childText(choice?.word||'____',state.level)+'</span>')+'</button>'}
function clozeTextWithBlanks(section,text,answers){
 return text.split(/(\{\{c\d+\}\})/).map(piece=>{const id=/^\{\{(c\d+)\}\}$/.exec(piece)?.[1];return id?clozeBlankButton(section.cloze.blanks.find(item=>item.id===id),answers,true):childText(piece,state.level)}).join('');
}
function compactClozeText(section,text,answers){return text.split('\n\n').map(paragraph=>'<p>'+clozeTextWithBlanks(section,paragraph,answers)+'</p>').join('')}
function clozeMarkup(section){
const scope=state.level+'|'+state.sid+'|'+state.p;if(scope!==clozeScope){selectedClozeWord=null;clozeScope=scope;clozeCompact=false}
const answers=state.answers[state.p]||{},index=clozePart(section),parts=clozeDisplayParts(section);
const renderPart=text=>clozeTextWithBlanks(section,text,answers);
const passage=clozeCompact?compactClozeText(section,parts[index],answers):innerWidth>=950&&section.cloze.columns?.length===2?section.cloze.columns.map(text=>'<div class="cloze-column"><p>'+renderPart(text)+'</p></div>').join(''):section.cloze.paragraphs.map(text=>'<p>'+renderPart(text)+'</p>').join('');
const used=new Set(section.cloze.blanks.map(blank=>answers[blank.id]).filter(Boolean));
return '<div class="cloze-part-tools">'+(clozeCompact?'<button type="button" class="page-step" data-cloze-part="-1" aria-label="Back to previous text on this story page" '+(index===0?'disabled':'')+'>← Back</button><span>Same story page · Text '+(index+1)+' / '+parts.length+'</span><button type="button" class="page-step" data-cloze-part="1" aria-label="Next text on this story page" '+(index===parts.length-1?'disabled':'')+'>Next →</button>':'<span>Read the whole page and fill all '+section.cloze.blanks.length+' blanks.</span>')+'</div><div class="story-text cloze-passage '+(clozeCompact?'':'full-passage')+'" aria-label="Cloze story">'+passage+'</div><div class="cloze-bank '+(clozeCompact?'with-pads':'')+'" style="--word-count:'+section.cloze.bank.length+'">'+'<div class="cloze-bank-heading"><b>Word bank</b><span>'+clozeCount(section,answers)+' / '+section.cloze.blanks.length+' words filled</span></div><div class="cloze-words">'+section.cloze.bank.map(word=>'<button type="button" draggable="false" class="cloze-word '+(used.has(word.id)?'placed ':'')+(selectedClozeWord===word.id?'selected':'')+'" data-token="'+word.id+'" aria-label="Word '+escapeHTML(word.word)+'" aria-pressed="'+(selectedClozeWord===word.id)+'">'+childText(word.word,state.level)+'</button>').join('')+'</div><p class="cloze-help" role="status">'+(selectedClozeWord?'Choose a blank for “'+escapeHTML(clozeChoice(section,selectedClozeWord)?.word||'')+'”.':'Drag a word into a story blank. You can move it again, or tap a word and then a blank.')+'</p></div>';
}
function fitClozePanel(){fitClearClozePanel()}
function redrawCloze(focusId){
const panel=$('clozePanel');if(!panel||!state||state.done)return;
const next=document.createElement('template');next.innerHTML=clozeMarkup(LEVELS[state.level].sections[state.p]);
const bank=panel.querySelector('.cloze-bank'),newBank=next.content.querySelector('.cloze-bank');
if(bank&&newBank){
 for(const selector of ['.cloze-part-tools','.cloze-passage'])panel.querySelector(selector).replaceWith(next.content.querySelector(selector));
 bank.className=newBank.className;
 for(const selector of ['.cloze-bank-heading','.cloze-help'])bank.querySelector(selector).innerHTML=newBank.querySelector(selector).innerHTML;
 const nextWords=newBank.querySelectorAll('.cloze-word');bank.querySelectorAll('.cloze-word').forEach((word,i)=>{word.className=nextWords[i].className;word.setAttribute('aria-pressed',nextWords[i].getAttribute('aria-pressed'))});
}else panel.replaceChildren(next.content);
bindCloze();fitClozePanel();updateReadingGate();
if(focusId)panel.querySelector('.cloze-blank[data-blank="'+focusId+'"]')?.focus({preventScroll:true});
}
function placeCloze(blankId,token){
if(!state||state.done||state.stage==='bike'||syncLatest())return;const section=LEVELS[state.level].sections[state.p];
if(!section.cloze.blanks.some(blank=>blank.id===blankId)||!clozeChoice(section,token))return;
const answers=state.answers[state.p]||=( {} ),source=section.cloze.blanks.find(blank=>answers[blank.id]===token),previous=answers[blankId];
if(source&&source.id!==blankId){if(previous)answers[source.id]=previous;else delete answers[source.id]}
answers[blankId]=token;selectedClozeWord=null;navpush('cloze_changed',blankId);redrawCloze(blankId);const help=$('clozePanel')?.querySelector('.cloze-help');if(help)help.textContent='“'+clozeChoice(section,token).word+'” placed. You can drag it again.';flashLandingPad('.cloze-blank[data-blank="'+blankId+'"]','Word placed. You can move it again.');return true;
}
function clearCloze(blankId){
if(!state||state.done||state.stage==='bike'||syncLatest())return;delete (state.answers[state.p]||{})[blankId];selectedClozeWord=null;navpush('cloze_cleared',blankId);redrawCloze(blankId);return true;
}
function clickCloze(button){
stopNarration();const blankId=button.dataset.blank;
if(blankId){if(selectedClozeWord)placeCloze(blankId,selectedClozeWord);else if(button.dataset.token){selectedClozeWord=button.dataset.token;redrawCloze(blankId)}}
else{selectedClozeWord=selectedClozeWord===button.dataset.token?null:button.dataset.token;redrawCloze()}
}
function finishClozeDrag(){
clearDragTargets();
document.querySelectorAll('.cloze-drop-ready').forEach(el=>el.classList.remove('cloze-drop-ready'));
document.querySelectorAll('.cloze-source-dragging').forEach(el=>el.classList.remove('cloze-source-dragging'));
document.documentElement.classList.remove('cloze-drag-active');document.querySelector('.cloze-story-ghost')?.remove();clozeDrag=null;
}
function clozeGestureScope(){return state.level+'|'+state.sid+'|'+state.p}
function validClozeGesture(drag=clozeDrag){return !!(drag&&state&&!state.done&&state.stage!=='bike'&&drag.scope===clozeGestureScope()&&clozeChoice(LEVELS[state.level].sections[state.p],drag.token))}
function clozeDropAt(x,y,fallback){
const panel=$('clozePanel');if(!panel)return {};const hit=document.elementFromPoint(x,y),direct=fallback?.closest?.('.cloze-blank,.cloze-drop-ref')||hit?.closest?.('.cloze-blank,.cloze-drop-ref');
if(direct&&panel.contains(direct))return {blank:direct};const bank=fallback?.closest?.('.cloze-bank')||hit?.closest?.('.cloze-bank');if(bank&&panel.contains(bank))return {bank};
// A small margin around each visible blank makes it easier to release a word.
let nearest=null,distance=Infinity;panel.querySelectorAll('.cloze-blank').forEach(blank=>{const r=blank.getBoundingClientRect();if(!r.width||!r.height||x<r.left-12||x>r.right+12||y<r.top-12||y>r.bottom+12)return;const d=Math.hypot(x-(r.left+r.right)/2,y-(r.top+r.bottom)/2);if(d<distance){nearest=blank;distance=d}});return nearest?{blank:nearest}:{};
}
function highlightClozeDrop(target){document.querySelectorAll('.cloze-drop-ready').forEach(el=>el.classList.remove('cloze-drop-ready'));target.blank?.classList.add('cloze-drop-ready')}
function beginClozeGesture(button,e){
if(!state||state.done||state.stage==='bike')return false;const token=button.dataset.token;if(!token)return false;
clozeDrag={button,token,blank:button.dataset.blank,scope:clozeGestureScope(),x:e.clientX,y:e.clientY,pointerId:e.pointerId,pointerType:e.pointerType||'mouse',dragging:false};stopNarration();return true;
}
function dropClozeGesture(x,y,fallback,mode){
const drag=clozeDrag,ghost=document.querySelector('.cloze-story-ghost'),contact=ghost?landingPadContact(ghost.getBoundingClientRect(),Array.from($('clozePanel').querySelectorAll('.cloze-blank')).filter(pad=>pad.dataset.blank!==drag?.blank)):null,target=contact?{blank:contact}:clozeDropAt(x,y,fallback),valid=validClozeGesture(drag);finishClozeDrag();if(!valid)return;
clozeClickGuard={x,y,until:Date.now()+350};let applied=false;
if(target.blank)applied=placeCloze(target.blank.dataset.blank,drag.token);else if(drag.blank&&target.bank)applied=clearCloze(drag.blank);
if(applied&&$('clozePanel'))$('clozePanel').dataset.lastDragMode=mode;
if(!applied){selectedClozeWord=drag.token;redrawCloze();const help=$('clozePanel')?.querySelector('.cloze-help');if(help)help.textContent='“'+clozeChoice(LEVELS[state.level].sections[state.p],drag.token).word+'” is selected. Drag it again, or tap a blank.'}
}
function moveClozePointer(e){
const drag=clozeDrag;if(!drag||!drag.token||drag.pointerId!==undefined&&e.pointerId!==drag.pointerId)return;
if(!drag.dragging&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<7)return;
drag.dragging=true;setDragTargets(drag.button,Array.from($('clozePanel').querySelectorAll('.cloze-blank')));document.documentElement.classList.add('cloze-drag-active');drag.button.classList.add('cloze-source-dragging');const ghost=moveDragTile(drag,e,'cloze-story-ghost',clozeChoice(LEVELS[state.level].sections[state.p],drag.token).word);
const contact=landingPadContact(ghost.getBoundingClientRect(),Array.from($('clozePanel').querySelectorAll('.cloze-blank')).filter(pad=>pad.dataset.blank!==drag.blank));
highlightClozeDrop(contact?{blank:contact}:clozeDropAt(e.clientX,e.clientY));
}
function endClozePointer(e){
const drag=clozeDrag;if(!drag||drag.pointerId!==undefined&&e.pointerId!==drag.pointerId)return;
if(drag.dragging){e.preventDefault();dropClozeGesture(e.clientX,e.clientY,null,'pointer');return}
finishClozeDrag();e.preventDefault();clozeClickGuard={x:e.clientX,y:e.clientY,until:Date.now()+350};clickCloze(drag.button);
}
function bindCloze(){
const panel=$('clozePanel');if(!panel)return;
if(!clozeEventsBound){
clozeEventsBound=true;document.addEventListener('pointermove',moveClozePointer,true);document.addEventListener('pointerup',endClozePointer,true);document.addEventListener('pointercancel',e=>{if(clozeDrag&&e.pointerId===clozeDrag.pointerId)finishClozeDrag()},true);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&clozeDrag)finishClozeDrag()},true);
if(!('PointerEvent' in window)){document.addEventListener('mousemove',moveClozePointer,true);document.addEventListener('mouseup',endClozePointer,true)}
}
panel.querySelectorAll('[data-cloze-part]').forEach(button=>button.onclick=()=>{
finishClozeDrag();
stopNarration();const section=LEVELS[state.level].sections[state.p];state.readParts||={};state.readParts[state.p]=Math.min(clozeDisplayParts(section).length-1,Math.max(0,clozePart(section)+Number(button.dataset.clozePart)));selectedClozeWord=null;navpush('story_part',state.readParts[state.p]+1);const step=button.dataset.clozePart;redrawCloze();const sameStep=panel.querySelector('[data-cloze-part="'+step+'"]');(sameStep&&!sameStep.disabled?sameStep:panel.querySelector('[data-cloze-part]:not(:disabled)'))?.focus({preventScroll:true});
});
panel.querySelectorAll('.cloze-word,.cloze-blank').forEach(button=>{
button.onclick=e=>{if(e.detail&&clozeClickGuard&&Date.now()<clozeClickGuard.until&&Math.hypot(e.clientX-clozeClickGuard.x,e.clientY-clozeClickGuard.y)<12)return;clickCloze(button)};
button.onpointerdown=e=>{
if(e.button!==0||e.isPrimary===false)return;
e.preventDefault();try{button.setPointerCapture(e.pointerId)}catch{}
if(!beginClozeGesture(button,e)){clozeDrag={button,token:'',blank:button.dataset.blank,scope:clozeGestureScope(),x:e.clientX,y:e.clientY,pointerId:e.pointerId,pointerType:e.pointerType||'mouse',dragging:false}}
};
if(!('PointerEvent' in window))button.onmousedown=e=>button.onpointerdown(e);
// One pointer gesture owns the word; browser-native dragging must not take it over.
button.draggable=false;button.ondragstart=e=>e.preventDefault();
});
}
function clozeReadAloud(section){
const answers=state.answers?.[state.p]||{},part=clozeCompact?clozeDisplayParts(section)[clozePart(section)]:section.cloze.paragraphs.join(' ');
return [clozeCompact?'Part '+(clozePart(section)+1)+' of '+clozeDisplayParts(section).length+'.':'Complete the story page.',part.replace(/\{\{(c\d+)\}\}/g,(_,id)=>clozeChoice(section,answers[id])?.word||'blank '+(Number(id.slice(1))+1)), 'Word bank: '+section.cloze.bank.map(word=>word.word).join('. ')+'.'];
}
function clozeReportRows(level,answers,pageTimes){
return LEVELS[level].sections.flatMap((section,p)=>(section.cloze?.blanks||[]).map((blank,i)=>{
const response=clozeChoice(section,answers[p]?.[blank.id])?.word||'';
return {section:p+1,item:'C'+(i+1),type:'Cloze',skill:'Vocabulary in context',prompt:blank.prompt,options:section.cloze.bank.map(word=>word.word),instruction:'Drag one word from the word bank into the blank.',response,correct:blank.word,mark:response===blank.word?1:0,seconds:Math.round(pageTimes[p]||0)};
}));
}
