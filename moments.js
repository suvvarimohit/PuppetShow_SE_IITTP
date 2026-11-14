(() => {
  const RULES = [
    ['throwRope', /\b(?:throws?|threw|casts?|cast)\s+(?:a\s+)?rope\b/i, 1.1],
    ['pullRope', /\b(?:pulls?|pulled|hauls?|hauled)\s+(?:the\s+)?(?:rope|boat|raft|person|fisherman|villager|him|her|them|himself|herself|themselves)\b|\b(?:pulls?|pulled|hauls?|hauled)\s+(?:him|her|them)\s+to\s+safety\b/i, 1.5],
    ['lift', /\b(?:lifts?|lifted|raises?|raised|hoists?|hoisted)\s+(?:the\s+)?(?:heavy\s+)?(?:branch|log|stone|rock|debris|trap|door|person|child|animal)\b/i, 1.45],
    ['kneel', /\b(?:kneels?|knelt|kneeling)\b/i, .9],
    ['give', /\b(?:gives?|gave|hands?|handed|offers?|offered|passes?|passed)\b.{0,45}\b(?:medicine|packet|food|water|bandage|herb|supplies|basket|rope)\b/i, 1.15],
    ['rescue', /\b(?:rescues?|rescued|frees?|freed|helps?|helped)\b.{0,55}\b(?:free|escape|out|safety|trapped|pinned|danger|river|water)\b|\b(?:is|was) freed\b/i, 1.35],
    ['pickup', /\b(?:picks? up|picked up|takes? hold of|took hold of|grabs?|grabbed|raises? the|raised the|holds?|held)\b.{0,45}\b(?:sword|shield|bow|staff|spear|book|basket|lantern|tool|flower|key|cup|rope|oar)\b/i, .9],
    ['rideBoat', /\b(?:boards?|boarded|sails?|sailed|rows?|rowed|paddles?|paddled|floats? across|climbs? into|climbed into)\b.{0,55}\b(?:boat|canoe|raft|ship)\b|\b(?:boards?|boarded|sails?|sailed|rows?|rowed|paddles?|paddled|floats? across)\b/i, 2.4],
    ['ride', /\b(?:rides?|rode|riding|mounts?|mounted|gallops?|galloped)\b|\b(?:goes?|went|travels?|travelled|traveled|journeys?|journeyed|walks?|walked)\b.{0,55}\b(?:on|upon|astride)\s+(?:(?:his|her|their|a|an|the)\s+)?(?:horse|camel|elephant)\b/i, 2.1],
    ['fight', /\b(?:fights?|fought|duels?|brawls?|battled|battling)\b/i, 2.2],
    ['aim', /\b(?:aims?|aimed|raises? (?:her|his|their|the)? ?(?:bow|staff|spear)|raised (?:her|his|their|the)? ?(?:bow|staff|spear)|draws? (?:a |the )?bow|drew (?:a |the )?bow|nocks? an? arrow|nocked an? arrow)\b/i, 1.0],
    ['attack', /\b(?:attacks?|shoots?|shot|fires?|fired|launches?|launched|strikes?|struck|hits?|hit|stabs?|stabbed|swings?|swung|slashes?|slashed|punch(?:es|ed|ing)?|kicks?|kicked)\b/i, 1.7],
    ['defend', /\b(?:defends?|defended|blocks?|blocked|parries?|parried|shielded|raises? (?:his|her|their|the)? ?shield|raised (?:his|her|their|the)? ?shield)\b/i, 1.6],
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
    ['meet', /\b(?:helps?|helped|meets?|met|gives?|gave|shares?|shared|steps? in front|stepped in front|stands? between|stood between)\b/i, 1.0],
    ['climb', /\b(?:climbs?|climbed|scales?|scaled)\b/i, 1.5],
    ['up', /\b(?:rises?|rose|takes? off|took off|flies? upward)\b/i, 1.2],
    ['down', /\b(?:lands?|landed|descends?|descended|comes? down|came down)\b/i, 1.1]
  ];
  const ROLE_ACTIONS = {
    human: new Set(['rideBoat','ride','pickup','fight','aim','attack','defend','fall','recover','dance','jump','run','walk','wave','enter','exit','backward','turn','meet','climb','up','down','throwRope','pullRope','lift','kneel','give','rescue']),
    animal: new Set(['fight','attack','fall','recover','dance','jump','run','walk','enter','exit','backward','turn','meet','climb','up','down','kneel','rescue']),
    bird: new Set(['fight','attack','fall','recover','dance','jump','run','walk','fly','enter','exit','backward','turn','meet','up','down']),
    object: new Set(['turn'])
  };
  const DURATION = {pickup:.9,aim:1,walk:1.25,run:1.05,ride:1.7,rideBoat:1.8,fly:1.5,jump:.8,wave:.8,turn:.6,dance:1.8,attack:1.25,fight:1.8,defend:1,fall:.9,recover:.8,enter:1,exit:1,backward:.9,meet:.8,climb:1.2,up:1,down:.9,throwRope:1.1,pullRope:1.5,lift:1.45,kneel:.9,give:1.15,rescue:1.35,still:.55};
  const LABEL = {pickup:'Pick up',aim:'Aim',walk:'Walk',run:'Run',ride:'Ride',rideBoat:'Boat ride',fly:'Fly',jump:'Jump',wave:'Wave',turn:'Turn',dance:'Dance',attack:'Attack',fight:'Fight',defend:'Defend',fall:'Fall',recover:'Recover',enter:'Enter',exit:'Exit',backward:'Retreat',meet:'Meet',climb:'Climb',up:'Rise',down:'Land',throwRope:'Throw rope',pullRope:'Pull to safety',lift:'Lift obstacle',kneel:'Kneel',give:'Hand over item',rescue:'Rescue',still:'Speak'};

  function roleOf(actor) {
    if (!actor) return 'human';
    if (actor.role === 'bird' || /parrot|peacock|eagle|crow|bird/i.test(`${actor.identity} ${actor.file}`)) return 'bird';
    if (actor.role === 'animal' || /animal-templates|animal-/i.test(`${actor.id} ${actor.file}`)) return 'animal';
    if (/human-rigs|human-rig/i.test(`${actor.id} ${actor.file}`)) return 'human';
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
    const actionMatches=/\b(?:boat|canoe|raft|ship)\b/i.test(source)&&matches.some(match=>match.kind==='rideBoat')?matches.filter(match=>match.kind!=='climb'):matches; if(actionMatches.some(match=>match.kind==='rideBoat'))primary=actionMatches.find(match=>match.kind==='rideBoat'); const distinct=[...new Map(actionMatches.map(match=>[match.kind,match])).values()];
    const complex=(distinct.length>1&&/\b(?:and then|before|after|while|as soon as|and)\b/i.test(source))||(/\b(?:arrow|bow|sword|shield|boat|horse|target|enemy|opponent)\b/i.test(source)&&matches.some(match=>['attack','fight','defend','ride','rideBoat'].includes(match.kind)))||Boolean(target&&['attack','fight','defend'].includes(primary.kind));
    const sequence=distinct.map(match=>match.kind),segments=distinct.map(match=>({kind:match.kind,duration:DURATION[match.kind]||match.duration||1})),duration=sequence.length>1?segments.reduce((sum,segment)=>sum+segment.duration,0):DURATION[primary.kind]||primary.duration||DURATION.still;
    return {kind:primary.kind,index:primary.index,word:primary.word,duration,label:LABEL[primary.kind]||LABEL.still,role,target:target||null,sequence,segments,needsAI:complex};
  }
  function apply(act) {
    const target=act.target||act.mentions?.find(character=>character.id!==act.actor?.id)||null,moment=classify(act.actionSource||act.sourceSentence||act.text,act.actor,target);
    act.moment=moment;
    if(moment.kind!=='still'){
      const movement={...act.movement,kind:moment.kind,label:moment.label,seconds:moment.duration};
      if(target&&(moment.sequence||[moment.kind]).some(kind=>['attack','fight','defend','meet','throwRope','pullRope','lift','give','rescue','kneel'].includes(kind))){movement.targetId=target.id;act.target=target}
      if(['walk','run','ride','rideBoat','climb','pullRope'].includes(moment.kind)){
        const pose=act.positions?.find(position=>position.id===act.actor?.id),target=act.target&&act.positions?.find(position=>position.id===act.target.id),baseX=pose?.x??.5,direction=target?(Math.sign(target.x-baseX)||1):(baseX>.82?-1:1),distance=moment.kind==='run'?.19:moment.kind==='ride'||moment.kind==='rideBoat'?.2:moment.kind==='climb'?.06:.11;
        movement.from={...(movement.from||{}),x:baseX};movement.to={...(movement.to||{}),x:Math.max(.06,Math.min(.94,baseX+direction*distance))};
      }
      if(moment.kind==='fly'){movement.from={...(movement.from||{}),line:'base',y:.88};movement.to={...(movement.to||{}),line:'upper',y:.39}}
      if(['ride','rideBoat','walk','run','pickup','aim','meet','attack','fight','defend','turn','wave','dance','jump','backward','enter','exit'].includes(moment.kind)){const pose=act.positions?.find(position=>position.id===act.actor?.id),y=pose?.y??.88;if(pose&&pose.line!=='upper'){pose.line='base';pose.y=.88}movement.from={...(movement.from||{}),y};movement.to={...(movement.to||{}),y};if(moment.kind==='ride'||moment.kind==='rideBoat'){movement.from.line='base';movement.to.line='base'}}else if(moment.kind==='down'){movement.from={...(movement.from||{}),line:'upper',y:.39};movement.to={...(movement.to||{}),line:'base',y:.88}}act.movement=movement;
    }
    return moment;
  }
  window.PuppetMoments={classify,apply,roleOf,actions:Object.freeze(Object.keys(LABEL))};
})();
