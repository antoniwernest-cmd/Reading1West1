/* Count completed work, independent of whether the answers are correct. */
function activityProgressMarkup(){
 const chapters=LEVELS[state.level].sections.map((section,index)=>{
  const answers=state.answers?.[index]||{};
  return {done:clozeCount(section,answers)+readingCompletion(section,answers).count,total:section.cloze.blanks.length+section.mc.length+section.match.rows.length};
 });
 const parts=bikeParts(state.level);
 const labels={done:parts.filter((_,i)=>parts.some(part=>part.key===state.bikeAnswers?.['b'+i])).length,total:parts.length};
 const overall=chapters.reduce((acc,chapter)=>({done:acc.done+chapter.done,total:acc.total+chapter.total}),labels);
 const current=state.stage==='bike'?labels:chapters[state.p];
 const meter=(label,{done,total},summary)=>'<div class="activity-progress-meter"><div class="activity-progress-caption"><strong>'+label+'</strong><span>'+summary+'</span></div><div class="activity-progress-track" role="progressbar" aria-label="'+label+' progress" aria-valuemin="0" aria-valuemax="'+total+'" aria-valuenow="'+done+'" aria-valuetext="'+done+' of '+total+' done; '+(total-done)+' left"><i style="width:'+(done/Math.max(1,total)*100)+'%"></i></div></div>';
 return '<section id="activityProgress" class="activity-progress" aria-label="Assessment progress">'+meter('Overall',overall,(overall.total-overall.done)+' of '+overall.total+' left')+meter(state.stage==='bike'?'Labelling':'Chapter '+(state.p+1),current,current.done+' of '+current.total+' done')+'</section>';
}
function updateActivityProgress(){
 const progress=$('activityProgress');if(progress&&state&&!state.done)progress.outerHTML=activityProgressMarkup();
}
