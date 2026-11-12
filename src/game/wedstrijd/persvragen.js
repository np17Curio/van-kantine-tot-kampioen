/* ===================== Extra persvragen ===================== */
// Meer variatie in de persconferenties (fans-pers.js maakPers). Per vraag drie antwoorden: b (bescheiden), z (zelfverzekerd),
// u (uitdagend), en een doel: waar een uitdagend antwoord gevolgen heeft (trainer, team, club, fans of ambitie).

// De hoofdvraag na de wedstrijd, per situatie: top (cijfer 8+), slecht (5,5 of lager), winst, verlies of gelijk
export function extraHoofdvragen(soort, wij, zij){
  const V = {
    top:[
      {id:'xBesteWed', doel:'ambitie', vraag:'Was dit de beste wedstrijd van je carrière?', b:'"Een van de betere. Maar ik wil er nog veel meer van dit soort spelen."', z:'"Tot nu toe wel. En de volgende wordt nog beter."', u:'"Dit is gewoon mijn niveau. Wen er maar aan."'},
      {id:'xNationaal', doel:'ambitie', vraag:'Na zo\'n wedstrijd: denk je aan het nationale elftal?', b:'"Dat is een droom, maar eerst moet ik hier elke week presteren."', z:'"Ik ben er klaar voor. De bondscoach weet me te vinden."', u:'"Als de bondscoach dit niet ziet, kijkt hij niet goed."'},
      {id:'xVoorWie', doel:'fans', vraag:'Aan wie draag je deze wedstrijd op?', b:'"Aan mijn familie. Zij staan er altijd voor me."', z:'"Aan iedereen die in me gelooft. Er komt nog meer."', u:'"Aan iedereen die zei dat ik het niet kon. Kijk nu maar."'},
      {id:'xMotm', doel:'team', vraag:'Je bent gekozen tot beste speler. Verdiend?', b:'"Ik had het net zo goed aan een ploeggenoot kunnen geven."', z:'"Ja. Ik heb vandaag het verschil gemaakt."', u:'"Natuurlijk. Wie anders? Kijk naar de rest."'},
      {id:'xVoorbereiding', doel:'trainer', vraag:'Hoe heb je je op deze wedstrijd voorbereid?', b:'"Gewoon zoals altijd: hard trainen en goed luisteren naar de staf."', z:'"Ik had een eigen plan. En het werkte."', u:'"Ik doe mijn eigen ding. De oefeningen van de trainer sla ik soms over."'},
      {id:'xKoppen', doel:'club', vraag:'Morgen sta je op alle voorpagina\'s. Kun je daarmee omgaan?', b:'"Ik lees het niet. Morgen sta ik gewoon weer op het trainingsveld."', z:'"Daar ben ik voor gemaakt. Laat ze maar schrijven."', u:'"Ik verdien die voorpagina. Nu het salaris nog."'},
      {id:'xRecord', doel:'ambitie', vraag:'Je loopt richting de topscorerstitel. Ga je die pakken?', b:'"Als het team wint, maakt het me niet uit wie scoort."', z:'"Ja. Dat is mijn doel dit seizoen."', u:'"Die titel is al van mij. De rest speelt voor de tweede plek."'},
    ],
    slecht:[
      {id:'xDruk', doel:'fans', vraag:'Voel je de druk van de supporters?', b:'"Ja, en dat is terecht. Ik moet ze iets teruggeven."', z:'"Druk hoort erbij. Ik kan ermee omgaan."', u:'"Druk? Die zetten de fans alleen op zichzelf."'},
      {id:'xBlessureVraag', doel:'trainer', vraag:'Ben je wel helemaal fit?', b:'"Ik voel me goed. Dit lag aan mij, niet aan mijn lichaam."', z:'"Ik ben fit. Volgende week zie je het verschil."', u:'"Vraag maar aan de medische staf waarom ik moest spelen."'},
      {id:'xPositie', doel:'trainer', vraag:'Stond je op je beste positie vandaag?', b:'"Ik speel waar de trainer me neerzet. Dat is mijn werk."', z:'"Ik kan overal spelen. Vandaag lukte het gewoon niet."', u:'"Nee. Iedereen zag dat, behalve de trainer."'},
      {id:'xHerpakken', doel:'ambitie', vraag:'Hoe ga je je herpakken?', b:'"Extra trainen en kritisch naar mezelf kijken."', z:'"Gewoon doorgaan. Ik ben zo weer terug."', u:'"Herpakken? Ik heb niks te herpakken. Volgende week scoor ik twee keer."'},
      {id:'xSocialKritiek', doel:'fans', vraag:'Op social media krijg je veel kritiek. Lees je dat?', b:'"Soms. Een deel van de kritiek is terecht."', z:'"Ik lees het niet. Ik weet zelf wat ik kan."', u:'"Mensen achter een toetsenbord hebben nog nooit tegen een bal getrapt."'},
      {id:'xBankDreigt', doel:'trainer', vraag:'Ben je bang dat je je basisplaats kwijtraakt?', b:'"Dat bepaalt de trainer. Ik moet het op de training laten zien."', z:'"Nee. Ik ben de beste op mijn plek."', u:'"Als ik op de bank beland, gaat het hier pas echt mis."'},
    ],
    winst:[
      {id:'xReeks', doel:'ambitie', vraag:'Jullie zitten in een goede reeks. Waar kan dit eindigen?', b:'"We kijken alleen naar de volgende wedstrijd."', z:'"Bovenin. Deze ploeg kan veel aan."', u:'"Bij de titel. En iedereen die iets anders denkt, krijgt ongelijk."'},
      {id:'xInvallers', doel:'team', vraag:'De wissels maakten vandaag het verschil. Hoe belangrijk is de bank?', b:'"Superbelangrijk. We hebben een brede, sterke groep."', z:'"Iedereen staat klaar. Dat maakt ons zo sterk."', u:'"Sommige jongens op de bank zijn beter dan wie er nu speelt."'},
      {id:'xThuisfort', doel:'fans', vraag:'Wat doet het publiek met jullie?', b:'"Ze trekken ons erdoor. Echt, dankjewel."', z:'"In dit stadion zijn we bijna niet te verslaan."', u:'"Ze mogen nog wel wat harder zingen. Ik hoor ze soms niet."'},
      {id:'xTrainerLof', doel:'trainer', vraag:'De trainer was na afloop erg tevreden over je. Wat heeft hij je gezegd?', b:'"Dat ik zo door moet gaan. Daar word ik blij van."', z:'"Dat ik belangrijk ben voor deze ploeg. Dat wist ik al."', u:'"Hij zei dat ik moet blijven doen wat ik doe. Ook als dat niet in zijn plan staat."'},
      {id:'xVolgendeTegen', doel:'club', vraag:'Volgende week wacht een lastige tegenstander. Klaar?', b:'"We bereiden ons goed voor, zoals altijd."', z:'"Wij zijn klaar. Laat ze maar komen."', u:'"Lastig? Voor hen misschien. Wij gaan er gewoon winnen."'},
      {id:'xZwaarbevochten', doel:'team', vraag:`Het was zwaar bevochten tegen ${zij}. Waren jullie wel beter?`, b:`"${zij} speelde goed. We zijn blij met de punten."`, z:'"We waren beter, ook al was het spannend."', u:`"${zij} was niks. We maakten het onszelf gewoon te moeilijk."`},
      {id:'xFeest', doel:'club', vraag:'Gaan jullie dit vanavond vieren?', b:'"Rustig aan. Morgen is er gewoon weer training."', z:'"Een etentje met de groep, dat hebben we verdiend."', u:'"Ik ga de stad in. De trainer hoeft het niet te weten."'},
    ],
    verlies:[
      {id:'xKleedkamer', doel:'team', vraag:'Wat werd er na afloop in de kleedkamer gezegd?', b:'"Dat blijft binnen de groep. We pakken het samen op."', z:'"Iedereen weet wat er beter moet. Dat is gezegd."', u:'"Er vielen harde woorden. En die waren nodig ook."'},
      {id:'xFansBoos', doel:'fans', vraag:'De supporters waren boos na afloop. Begrijp je dat?', b:'"Helemaal. Ze verdienen veel beter dan dit."', z:'"Ja. Volgende week maken we het goed."', u:'"Ze moeten ons juist nu steunen, niet uitfluiten."'},
      {id:'xCrisis', doel:'club', vraag:'Is er een crisis bij de club?', b:'"Nee. We hebben een paar mindere weken. Dat gebeurt."', z:'"Crisis is een groot woord. Wij komen hier sterker uit."', u:'"Vraag dat maar aan het bestuur. Daar zit het probleem."'},
      {id:'xTrainerOnderVuur', doel:'trainer', vraag:'De trainer ligt onder vuur. Sta je achter hem?', b:'"Honderd procent. Hij heeft het vertrouwen van de groep."', z:'"Wij spelen, wij moeten het oplossen. Niet de trainer."', u:'"Daar wil ik niks over zeggen. En dat zegt genoeg."'},
      {id:'xGoalsTegen', doel:'team', vraag:'Jullie krijgen te veel tegengoals. Hoe komt dat?', b:'"We verdedigen met z\'n allen, en dat moet beter, ook van mij."', z:'"Dat lossen we op. Daar gaan we deze week op trainen."', u:'"Kijk maar naar onze achterhoede. Meer hoef ik niet te zeggen."'},
      {id:'xGeluk', doel:'club', vraag:`Had ${zij} geluk vandaag?`, b:`"Nee, ${zij} was gewoon beter. Dat moet je erkennen."`, z:'"Een beetje. Over twee wedstrijden waren wij de winnaar geweest."', u:`"Puur geluk. ${zij} kan niet eens fatsoenlijk voetballen."`},
    ],
    gelijk:[
      {id:'xPuntWaard', doel:'ambitie', vraag:'Is dit een gewonnen of een verloren punt?', b:'"Een punt is een punt. We nemen het mee."', z:'"Een verloren punt. Wij hadden moeten winnen."', u:'"Twee verloren punten. En dat ligt niet aan mij."'},
      {id:'xLaatGoal', doel:'team', vraag:'Jullie gaven de winst laat in de wedstrijd weg. Wat gebeurde er?', b:'"We waren even niet scherp. Dat moet beter."', z:'"Een moment van onoplettendheid. Dat overkomt ons niet nog eens."', u:'"Sommigen dachten dat de wedstrijd al klaar was. Ik niet."'},
      {id:'xSaai', doel:'fans', vraag:'Het was geen spektakel. Vonden de fans het saai?', b:'"Misschien wel. We moeten meer laten zien."', z:'"Soms moet je gewoon winnen... of in ieder geval niet verliezen."', u:'"Wie spektakel wil, moet naar het circus."'},
      {id:'xScherpte', doel:'ambitie', vraag:'Waar ontbrak het aan voor de goal?', b:'"Aan scherpte. Daar ga ik deze week extra op trainen."', z:'"De goals komen wel. Ik maak me geen zorgen."', u:'"Als ik de bal vaker had gekregen, hadden we gewonnen."'},
      {id:'xTactischGelijk', doel:'trainer', vraag:'Speelden jullie te voorzichtig?', b:'"We wilden eerst goed staan. Dat lukte."', z:'"Misschien. Volgende keer gaan we er vol voor."', u:'"Ik wilde aanvallen. Maar dat mocht niet."'},
      {id:'xRegen', doel:'club', vraag:'Hoe was het veld vandaag?', b:'"Lastig, maar voor beide ploegen hetzelfde."', z:'"Geen excuus. Goede spelers spelen overal."', u:'"Dit veld is een aardappelakker. De club moet daar echt iets aan doen."'},
    ],
  };
  return V[soort] || [];
}

// Algemene vervolgvragen (over van alles: je toekomst, je privéleven, je idolen, de groep)
export function extraVervolgvragen(wij){
  return [
    {id:'xIdool', doel:'ambitie', vraag:'Wie was als kind je grote voorbeeld?', b:'"Mijn vader. Hij nam me elke zaterdag mee naar het veld."', z:'"Ik keek naar de besten, en nu wil ik zelf zo iemand worden."', u:'"Niemand. Ik wil dat kinderen later naar mij opkijken."'},
    {id:'xSocial', doel:'fans', vraag:'Je bent erg actief op social media. Is dat goed voor je focus?', b:'"Ik let erop dat het niet te veel wordt. Voetbal gaat voor."', z:'"Dat hoort erbij tegenwoordig. Ik kan het allebei."', u:'"Mijn volgers zijn mijn echte fans. Meer dan die op de tribune."'},
    {id:'xOuders', doel:'club', vraag:'Wat betekenen je ouders voor je carrière?', b:'"Alles. Zonder hen stond ik hier niet."', z:'"Ze hebben me gevormd. De rest heb ik zelf gedaan."', u:'"Mijn ouders weten meer van voetbal dan sommige mensen hier bij de club."'},
    {id:'xTraining', doel:'trainer', vraag:'Hoe zwaar zijn de trainingen deze weken?', b:'"Zwaar, en dat is goed. Daar worden we beter van."', z:'"Ik kan het makkelijk aan. Ik wil eigenlijk nog meer."', u:'"Te zwaar. Op zondag lopen we op onze tandvlees."'},
    {id:'xKapitein', doel:'team', vraag:'Zie je jezelf later als aanvoerder van deze ploeg?', b:'"Als de groep dat wil, graag. Maar dat is nu niet aan de orde."', z:'"Ja. Ik ben een leider, op en naast het veld."', u:'"De band zou nu al om mijn arm moeten zitten."'},
    {id:'xBuitenland', doel:'club', vraag:'Lijkt het buitenland je wat?', b:`"Ik heb het hier bij ${wij} naar mijn zin. Daar denk ik nu niet aan."`, z:'"Ooit wel. Elke speler droomt van de grote competities."', u:'"Liever vandaag dan morgen. Hier word ik niet beter."'},
    {id:'xJeugd', doel:'team', vraag:'Er komen veel jonge spelers bij. Help je ze?', b:'"Natuurlijk. Ik weet nog hoe het voor mij was."', z:'"Ze kunnen veel van me leren, als ze goed opletten."', u:'"Ze moeten eerst maar eens laten zien dat ze hier thuishoren."'},
    {id:'xScheidsAlg', doel:'club', vraag:'Wat vind je van de scheidsrechters dit seizoen?', b:'"Ze doen hun best. Het is een moeilijk vak."', z:'"Er gaat wel eens wat mis, maar dat hoort bij voetbal."', u:'"Het niveau is bedroevend. De bond moet daar echt wat aan doen."'},
    {id:'xVar', doel:'club', vraag:'Ben je een fan van de VAR?', b:'"Het maakt het eerlijker. Daar kan ik mee leven."', z:'"Soms wel, soms niet. Het moet sneller."', u:'"De VAR maakt voetbal kapot. Weg ermee."'},
    {id:'xVrijeTijd', doel:'fans', vraag:'Wat doe je op een vrije dag?', b:'"Rustig thuis, en tijd met mijn familie."', z:'"Gamen, uit eten, en een beetje bijkomen."', u:'"Dat gaat niemand iets aan. Ook de fans niet."'},
    {id:'xSchoenen', doel:'fans', vraag:'Je hebt opvallende schoenen. Is dat een statement?', b:'"Ze zitten gewoon lekker. Meer is het niet."', z:'"Je moet opvallen op het veld. Ook aan je voeten."', u:'"Ik val toch al het meest op. De schoenen helpen alleen een beetje."'},
    {id:'xToekomstClub', doel:'club', vraag:`Zie je jezelf over vijf jaar nog bij ${wij}?`, b:'"Als het aan mij ligt wel. Ik voel me hier thuis."', z:'"Wie weet. Ik wil zo hoog mogelijk komen."', u:'"Over vijf jaar speel ik op een veel hoger niveau. Dat is zeker."'},
    {id:'xMentaal', doel:'ambitie', vraag:'Werk je met een mental coach?', b:'"Ja. Het helpt me om rustig te blijven."', z:'"Mijn hoofd is mijn sterkste wapen. Daar werk ik elke dag aan."', u:'"Dat heb ik niet nodig. Ik ben mentaal sterker dan iedereen hier."'},
    {id:'xKleedkamerMuziek', doel:'team', vraag:'Wie bepaalt de muziek in de kleedkamer?', b:'"Dat wisselt. Iedereen mag eens wat kiezen."', z:'"Ik. En iedereen vindt het goed."', u:'"Ik, want de rest heeft slechte smaak."'},
    {id:'xBondscoach', doel:'ambitie', vraag:'Heb je al contact gehad met de bondscoach?', b:'"Nee. Ik focus me op de club, de rest komt vanzelf."', z:'"Nog niet, maar dat telefoontje komt."', u:'"Hij weet waar ik woon. Ik ga hem niet zelf bellen."'},
    {id:'xBeker', doel:'ambitie', vraag:'Hoe belangrijk is de beker voor jullie?', b:'"Elke prijs is mooi. We nemen het serieus."', z:'"We willen die beker winnen. Zo simpel is het."', u:'"Belangrijker dan de competitie. Daar zijn we toch al te laat."'},
    {id:'xRolmodel', doel:'fans', vraag:'Kinderen kijken naar je op. Voel je je een rolmodel?', b:'"Ja, en daar ben ik me van bewust. Ik wil een goed voorbeeld zijn."', z:'"Dat hoort erbij als je goed bent. Ik doe mijn best."', u:'"Ik ben voetballer, geen opvoeder. Ouders moeten dat zelf doen."'},
    {id:'xSalaris', doel:'club', vraag:'Verdien je genoeg bij deze club?', b:'"Ik ben tevreden. Geld is niet het belangrijkste."', z:'"Als ik zo blijf spelen, praten we daar later over."', u:'"Nee. Kijk naar wat ik lever en kijk naar mijn loonstrook."'},
  ];
}
