/* Keep the tile under the point the student grabbed, for mouse and touch. */
function moveDragTile(drag,event,className,text) {
 let ghost=document.querySelector('.'+className);
 if(!ghost){
  ghost=document.createElement('div');ghost.className='cloze-drag-ghost '+className;
  ghost.setAttribute('aria-hidden','true');ghost.textContent=text;
  ghost.style.fontSize=getComputedStyle(drag.button).fontSize;
  document.body.append(ghost);
  const source=drag.button.getBoundingClientRect(),tile=ghost.getBoundingClientRect();
  drag.grabX=Math.max(0,Math.min(1,(drag.x-source.left)/Math.max(1,source.width)))*tile.width;
  drag.grabY=Math.max(0,Math.min(1,(drag.y-source.top)/Math.max(1,source.height)))*tile.height;
 }
 ghost.style.left=(event.clientX-drag.grabX)+'px';ghost.style.top=(event.clientY-drag.grabY)+'px';
 return ghost;
}
/* Place a movable tile as soon as its visible edge touches a landing pad. */
function landingPadContact(tile, pads) {
 if (!tile || !tile.width || !tile.height) return null;
 let closest=null, distance=Infinity;
 for (const pad of pads) {
  const box=pad.getBoundingClientRect();
  if (!box.width || !box.height || tile.right<box.left || tile.left>box.right || tile.bottom<box.top || tile.top>box.bottom) continue;
  const gap=Math.hypot((tile.left+tile.right-box.left-box.right)/2,(tile.top+tile.bottom-box.top-box.bottom)/2);
  if (gap<distance) { closest=pad; distance=gap; }
 }
 return closest;
}
let contactPointer=null,contactClickUntil=0;
function suppressContactRelease(event) {
 contactPointer=event.pointerId??null;
 contactClickUntil=Date.now()+400;
}
document.addEventListener('pointerdown',()=>{if(contactPointer===null)contactClickUntil=0},true);
document.addEventListener('pointerup',event=>{
 if (contactPointer!==null && event.pointerId===contactPointer) {
  event.preventDefault();contactPointer=null;contactClickUntil=Date.now()+400;
 }
},true);
document.addEventListener('pointercancel',()=>{contactPointer=null},true);
document.addEventListener('click',event=>{
 if (event.detail && (contactPointer!==null || Date.now()<contactClickUntil)) {
  event.preventDefault();event.stopImmediatePropagation();
 }
},true);
