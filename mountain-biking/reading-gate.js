/* Completion checks require a valid response in every pad, regardless of correctness. */
function readingVisits(){state.readingVisits||={};if(!Array.isArray(state.readingVisits[state.p]))state.readingVisits[state.p]=[];return state.readingVisits[state.p]}
function noteReadingVisit(index){if(!state||state.done||state.stage!=='story')return;const section=LEVELS[state.level].sections[state.p];if(!Number.isInteger(index)||index<0||index>section.mc.length)return;const visited=readingVisits();if(!visited.includes(index)){visited.push(index);navpush('reading_section_opened',index===section.mc.length?'Matching':'Question '+(index+1))}}
function readingCompletion(section,answers={}){const questionCount=section.mc.filter((q,i)=>answers['m'+i]!==undefined&&answers['m'+i]!==''&&Number.isInteger(Number(answers['m'+i]))&&q.choices[Number(answers['m'+i])]!==undefined).length,matchCount=section.match.rows.filter((_,i)=>section.match.options.includes(answers['t'+i])).length;return {questionCount,matchCount,count:questionCount+matchCount,complete:questionCount===section.mc.length&&matchCount===section.match.rows.length}}
function storyPadsComplete(section,answers={}){return clozeCount(section,answers)===section.cloze.blanks.length}
function readingReady(section,answers={}){const visited=state.readingVisits?.[state.p]||[];return [...section.mc.map((_,i)=>i),section.mc.length].every(index=>visited.includes(index))&&readingCompletion(section,answers).complete&&storyPadsComplete(section,answers)}
function updateReadingGate(){
 if(!state||state.done||state.stage!=='story')return;
 const section=LEVELS[state.level].sections[state.p],answers=state.answers[state.p]||{},done=readingCompletion(section,answers),visited=state.readingVisits?.[state.p]||[],missing=[...section.mc.map((_,i)=>({index:i,name:'Question '+(i+1)})),{index:section.mc.length,name:'Matching'}].filter(item=>!visited.includes(item.index)).map(item=>item.name),button=$('nextBtn'),status=$('answerStatus');
 if(button)button.hidden=!readingReady(section,answers);
 updateActivityProgress();
 if(status){
  let message='';
  if(missing.length)message='Open '+missing.join(' and ')+'.';
  else if(!done.complete)message=done.questionCount===section.mc.length?'Finish every matching pair.':done.matchCount===section.match.rows.length?'Answer every question.':'Answer every question and matching pair.';
  else if(!storyPadsComplete(section,answers))message='Fill every story blank.';
  status.textContent='Story '+clozeCount(section,answers)+' / '+section.cloze.blanks.length+' · Questions '+done.count+' / '+(section.mc.length+section.match.rows.length)+(message?' · '+message:'');
 }
}
function bikeComplete(){if(!state||state.stage!=='bike')return false;const parts=bikeParts(state.level);return parts.every((_,i)=>parts.some(part=>part.key===state.bikeAnswers?.['b'+i]))}
function guardAdvance(){if(!state||state.done)return false;if(state.stage==='bike'){if(bikeComplete())return true;if($('bikeHelp'))$('bikeHelp').textContent='Label every numbered bike part before you finish.';return false}const section=LEVELS[state.level].sections[state.p],answers=state.answers[state.p]||{};if(readingReady(section,answers))return true;view=storyPadsComplete(section,answers)?'questions':'story';render();updateReadingGate();return false}
