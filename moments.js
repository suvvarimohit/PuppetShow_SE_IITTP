(() => {
  const RULES = [
    ['rideBoat', /\b(?:boards?|boarded|sails?|sailed|rows?|rowed|paddles?|paddled|floats? across)\b/i, 2.4],
    ['ride', /\b(?:rides?|rode|riding|mounts?|mounted|gallops?|galloped)\b/i, 2.1],
    ['fight', /\b(?:fights?|fought|duels?|brawls?|battled|battling)\b/i, 2.2],
    ['attack', /\b(?:attacks?|shoots?|shot|fires?|fired|launches?|launched|strikes?|struck|hits?|hit|stabs?|stabbed|swings?|swung|slashes?|slashed|punch(?:es|ed|ing)?|kicks?|kicked)\b/i, 1.7],
    ['defend', /\b(?:defends?|defended|blocks?|blocked|parries?|parried|shields?)\b/i, 1.6],
    ['fall', /\b(?:falls?|fell|topples?|toppled|collapses?|collapsed)\b/i, 1.3],
    ['recover', /\b(?:gets? up|got up|stands? up|stood up|recovers?|recovered)\b/i, 1.1],
    ['dance', /\b(?:dances?|danced|twirls?|twirled|spins?|spun|celebrates?|celebrated)\b/i, 2.0],
    ['jump', /\b(?:jumps?|jumped|leaps?|leaped|hops?|hopped)\b/i, 1.0],
    ['fly', /\b(?:flies|flew|flying|soars?|soared|takes? flight|took flight)\b/i, 1.8],
    ['run', /\b(?:runs?|ran|running|sprints?|sprinted|races?|raced|rushes?|rushed|chases?|chased|dashes?|dashed)\b/i, 1.5],
    ['walk', /\b(?:walks?|walked|walking|strolls?|strolled|marches?|marched|travels?|travelled|traveled|crosses?|crossed|approaches?|approached|returns?|returned|heads?|headed)\b/i, 1.7],
    ['wave', /\b(?:waves?|waved|greets?|greeted|signals?|signaled)\b/i, 1.2],
    ['enter', /\b(?:enters?|entered|arrives?|arrived|appears?|appeared|joins?|joined)\b/i, 1.2],
    ['exit', /\b(?:departs?|departed|exits?|exited|flees|fled|escapes?|escaped|leaves?|left)\b/i, 1.2],
    ['backward', /\b(?:retreats?|retreated|backs? away|backed away|steps? back|stepped back|recoils?|recoiled)\b/i, 1.1],
    ['turn', /\b(?:turns?|turned|faces?|faced|looks? toward|looked toward)\b/i, .8],
    ['meet', /\b(?:helps?|helped|meets?|met|gives?|gave|shares?|shared|steps? in front|stepped in front|stands? between|stood between|dances? with|danced with)\b/i, 1.0],
    ['climb', /\b(?:climbs?|climbed|scales?|scaled)\b/i, 1.5],
    ['up', /\b(?:rises?|rose|takes? off|took off|flies? upward)\b/i, 1.2],
    ['down', /\b(?:lands?|landed|descends?|descended|comes? down|came down)\b/i, 1.1]
  ];
  const ROLE_ACTIONS = {
    human: new Set(['rideBoat','ride','fight','attack','defend','fall','recover','dance','jump','run','walk','wave','enter','exit','backward','turn','meet','climb','up','down']),
    animal: new Set(['fight','attack','fall','recover','dance','jump','run','walk','enter','exit','backward','turn','meet','climb','up','down']),
    bird: new Set(['fight','attack','fall','recover','dance','jump','run','walk','fly','enter','exit','backward','turn','meet','up','down']),
    object: new Set(['turn'])
  };
  const DURATION = {walk:1.25,run:1.05,ride:1.7,rideBoat:1.8,fly:1.5,jump:.8,wave:.8,turn:.6,dance:1.8,attack:1.25,fight:1.8,defend:1,fall:.9,recover:.8,enter:1,exit:1,backward:.9,meet:.8,climb:1.2,up:1,down:.9,still:.55};
  const LABEL = {walk:'Walk',run:'Run',ride:'Ride',rideBoat:'Boat ride',fly:'Fly',jump:'Jump',wave:'Wave',turn:'Turn',dance:'Dance',attack:'Attack',fight:'Fight',defend:'Defend',fall:'Fall',recover:'Recover',enter:'Enter',exit:'Exit',backward:'Retreat',meet:'Meet',climb:'Climb',up:'Rise',down:'Land',still:'Speak'};

  function roleOf(actor) {
    if (!actor) return 'human';
    if (actor.role === 'bird' || /parrot|peacock|eagle|crow|bird/i.test(`${actor.identity} ${actor.file}`)) return 'bird';
    if (actor.role === 'animal' || /animal-templates|animal-/i.test(`${actor.id} ${actor.file}`)) return 'animal';
    if (/human-templates|human-template/i.test(`${actor.id} ${actor.file}`)) return 'human';
    if (/tree|plant|flower|sun|moon|river|mountain/i.test(actor.identity||'')) return 'object';
    return 'human';
  }
  function classify(sentence, actor, target) {
    const source=String(sentence||''), role=roleOf(actor), matches=[];
    for(const [kind,pattern] of RULES){const match=pattern.exec(source);if(match&&ROLE_ACTIONS[role].has(kind))matches.push({kind,index:match.index,word:match[0],duration:DURATION[kind]||1})}
    matches.sort((a,b)=>a.index-b.index);
    let primary=matches[0]||{kind:'still',index:-1,word:'',duration:DURATION.still};
    if(role==='bird'&&primary.kind==='walk'&&/\b(?:fly|flew|flies|soar|soared)\b/i.test(source))primary=matches.find(m=>m.kind==='fly')||primary;
    if(role!=='human'&&primary.kind==='rideBoat')primary={kind:'walk',index:primary.index,word:primary.word,duration:DURATION.walk};
    const distinct=[...new Map(matches.map(match=>[match.kind,match])).values()];
    const complex=(distinct.length>1&&/\b(?:and then|before|after|while|as soon as|and)\b/i.test(source))||(/\b(?:arrow|bow|sword|shield|boat|horse|target|enemy|opponent)\b/i.test(source)&&matches.some(match=>['attack','fight','defend','ride','rideBoat'].includes(match.kind)))||Boolean(target&&['attack','fight','defend'].includes(primary.kind));
    return {kind:primary.kind,index:primary.index,word:primary.word,duration:DURATION[primary.kind]||primary.duration||DURATION.still,label:LABEL[primary.kind]||LABEL.still,role,target:target||null,sequence:distinct.map(match=>match.kind),needsAI:complex};
  }
  function apply(act) {
    const target=act.target||act.mentions?.find(character=>character.id!==act.actor?.id)||null,moment=classify(act.actionSource||act.sourceSentence||act.text,act.actor,target);
    act.moment=moment;
    if(moment.kind!=='still'){
      const movement={...act.movement,kind:moment.kind,label:moment.label,seconds:moment.duration};
      if(target&&['attack','fight','defend','meet'].includes(moment.kind)){movement.targetId=target.id;act.target=target}
      if(['walk','run','ride','rideBoat','climb'].includes(moment.kind)){
        const pose=act.positions?.find(position=>position.id===act.actor?.id),target=act.target&&act.positions?.find(position=>position.id===act.target.id),baseX=pose?.x??.5,direction=target?(Math.sign(target.x-baseX)||1):(baseX>.82?-1:1),distance=moment.kind==='run'?.19:moment.kind==='ride'||moment.kind==='rideBoat'?.2:moment.kind==='climb'?.06:.11;
        movement.from={...(movement.from||{}),x:baseX};movement.to={...(movement.to||{}),x:Math.max(.06,Math.min(.94,baseX+direction*distance))};
      }
      if(moment.kind==='fly'){movement.from={...(movement.from||{}),line:'base',y:.75};movement.to={...(movement.to||{}),line:'upper',y:.39}}
      act.movement=movement;
    }
    return moment;
  }
  window.PuppetMoments={classify,apply,roleOf,actions:Object.freeze(Object.keys(LABEL))};
})();
