/* Use a wide display for the editable story and notebook at the same time. */
function wideWorkspace(){return innerWidth>=1280&&innerHeight>=680&&innerWidth>innerHeight}
function updateScreenButton(){
 const button=document.getElementById('screenModeBtn');if(!button)return;
 const expanded=!!(document.fullscreenElement||document.webkitFullscreenElement),label=expanded?'Exit full screen':'Full screen';
 button.title=label;button.setAttribute('aria-label',label);button.setAttribute('aria-pressed',String(expanded));button.querySelector('.screen-label').textContent=label;
}
function bindScreenTools(){
 bindTextSizeControls();
 if(document.getElementById('screenModeBtn')){updateScreenButton();return}
 const host=document.querySelector('.start-actions')||document.querySelector('.top-info')||document.querySelector('.receipt');if(!host)return;
 const button=document.createElement('button');button.type='button';button.id='screenModeBtn';button.className='screen-mode quiet';
 button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3V8M16 3H21V8M3 16V21H8M21 16V21H16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="screen-label">Full screen</span>';
 button.onclick=async()=>{
  try{
   if(document.fullscreenElement||document.webkitFullscreenElement){const leave=document.exitFullscreen||document.webkitExitFullscreen;if(leave)await leave.call(document)}
   else{const enter=document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen;if(!enter)throw new Error('unavailable');await enter.call(document.documentElement)}
   updateScreenButton();
  }catch{
   let notice=document.getElementById('screenModeNotice');if(!notice){notice=document.createElement('div');notice.id='screenModeNotice';notice.setAttribute('role','status');host.append(notice)}
   notice.textContent='To use more width, open this activity in a full browser window and choose Full screen.';
   const close=document.createElement('button');close.type='button';close.className='quiet';close.textContent='Close';close.onclick=()=>notice.remove();notice.append(close);
  }
 };
 host.append(button);updateScreenButton();
}
document.addEventListener('fullscreenchange',updateScreenButton);
document.addEventListener('webkitfullscreenchange',updateScreenButton);
