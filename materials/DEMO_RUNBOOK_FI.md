# Demon suoritusohje opettajalle

Tämä ohje on tarkoitettu pidettäväksi auki demon aikana. Jokaisessa vaiheessa on erikseen **mitä teet**, **mitä sanot** ja **mitä pitäisi näkyä**. Demon kesto on noin 30–35 minuuttia. Älä poista tai kommentoi turvamiddlewarea kesken luennon: käyttöliittymän Teaching lab näyttää saman asian turvallisesti.

## Demon tavoite

Opiskelijan pitäisi demon jälkeen ymmärtää neljä asiaa:

1. Vierasistunto ei ole sama asia kuin autentikoitu käyttäjä.
2. React voi piilottaa toimintoja, mutta Express päättää oikeuksista.
3. `401` tarkoittaa puuttuvaa autentikointia ja `403` puuttuvaa oikeutta.
4. HTTP-only-evästeessä oleva istuntotunniste on tämän selainapplikaation valittu ratkaisu; JWT on mahdollinen mutta monimutkaisempi vaihtoehto.

# Valmistelu ennen luentoa

## Käynnistä ja tarkista sovellus

**Tee PowerShellissä projektin juuressa:**

```powershell
npm install
npm test
npm run dev
```

Avaa `http://localhost:5173`. Avaa selaimen kehittäjätyökalut ja kiinnitä ne ikkunan oikeaan reunaan.

Pidä valmiina seuraavat välilehdet:

- Network, suodatuksena `Fetch/XHR`
- Application tai Storage → Cookies → `http://localhost:5173`
- VS Code, jossa ovat auki `server/src/app.js`, `server/src/auth.js`, `client/src/main.jsx` ja `server/test/auth.test.js`

Käytä mielellään yksityistä selainikkunaa, jotta vanha istunto ei vaikuta demoon. Palvelimen uudelleenkäynnistys tyhjentää demon muistissa olevat ostokset.

> Paikallisessa HTTP-kehityksessä evästeen nimi on `cinema-session`, eikä sillä ole `Secure`-ominaisuutta. Tuotannossa HTTPS-yhteydellä nimi on `__Host-cinema-session` ja `Secure` on käytössä. Kerro tämä ääneen, jotta paikallinen näkymä ei näytä olevan ristiriidassa diojen tuotantoesimerkin kanssa.

# Vaihe 1 Aloita kirjautumattomana

Arvioitu aika: 3 minuuttia.

## Mitä teet

1. Varmista, että yläkulmassa lukee **Guest**.
2. Vieritä kohtaan **Your role-aware workspace**.
3. Näytä, ettei normaaleja käyttäjätoimintoja ole tarjolla.
4. Vieritä kohtaan **Teaching lab**.
5. Paina `GET /api/my-purchases`.

## Mitä sanot

“Aloitamme kirjautumattomana käyttäjänä. Sovelluksen normaali käyttöliittymä ei tarjoa tilitoimintoja, koska React ei tunne kirjautunutta käyttäjää. Tämä on hyvää käytettävyyttä, mutta se ei vielä ole tietoturvaa.”

“Teaching lab ohittaa tarkoituksella käyttöliittymän näkyvyyssäännöt ja lähettää pyynnön suoraan API:lle. Katsotaan, päättääkö selain vai palvelin.”

## Mitä pitäisi näkyä

Viestissä näkyy:

```text
401 — Please sign in first.
```

Sano: “Pyyntö saavutti Expressin, mutta `requireAuthentication` pysäytti sen. `401` tarkoittaa tässä, ettei autentikoitua käyttäjää ole.”

# Vaihe 2 Tee vierasosto

Arvioitu aika: 4 minuuttia.

## Mitä teet

1. Paina ensimmäisen näytöksen painiketta **Book seat C7 as a guest**.
2. Näytä onnistumisviesti.
3. Avaa Network-välilehdeltä `POST /api/purchases`.
4. Näytä request payload ja `201 Created` -vastaus.
5. Avaa selaimen Cookies-näkymä ja näytä `cinema-session`.
6. Palaa Teaching labiin ja pyydä uudelleen omia ostoksia.

## Mitä sanot

“Asiakas pystyy ostamaan ilman tiliä. Palvelin luo vierasistunnon ja liittää siihen tilapäisen ostosprosessin. Istunto auttaa tunnistamaan saman selaimen myöhemmissä pyynnöissä, mutta se ei todista henkilön identiteettiä.”

“Huomatkaa tärkeä ero: käyttäjällä on nyt istunto, mutta hän ei ole autentikoitu.”

“API ei palauta sisäistä `guestId`-tunnistetta selaimelle. Selain saa vain ostoksen julkisen esityksen. Istunnon varsinainen tunniste kulkee HTTP-only-evästeessä.”

## Mitä pitäisi näkyä

- Ostosvastauksessa `checkoutType` on `guest`.
- Evästeessä näkyvät `HttpOnly` ja `SameSite=Lax`.
- `GET /api/my-purchases` palauttaa edelleen `401`.

Sano: “Vierasosto ei muutu kirjautumiseksi vain siksi, että selain sai evästeen.”

# Vaihe 3 Näytä epäonnistunut kirjautuminen

Arvioitu aika: 2 minuuttia.

## Mitä teet

1. Valitse Customer-tili.
2. Kirjoita salasanaksi esimerkiksi `wrong-password`.
3. Paina **Sign in**.

## Mitä sanot

“Palvelin antaa saman yleisen virheilmoituksen riippumatta siitä, oliko sähköposti vai salasana väärä. Näin kirjautumisrajapinta ei tarpeettomasti kerro, mitä käyttäjätilejä järjestelmässä on.”

“Kirjautumisreitillä on myös kevyt rate limit. Tuotannossa tarvitaan lisäksi seurantaa, vahvaa tunnistautumista tilanteen mukaan ja huolellinen tilin palautusprosessi.”

## Mitä pitäisi näkyä

```text
401 — Incorrect email or password.
```

# Vaihe 4 Kirjaudu asiakkaana

Arvioitu aika: 4 minuuttia.

## Mitä teet

1. Palauta salasanaksi `demo1234`.
2. Kirjaudu Customer-tilillä.
3. Näytä yläkulmasta nimi ja rooli `customer`.
4. Näytä **Your role-aware workspace**.

## Mitä sanot

“Nyt palvelin vertaa annettua salasanaa bcrypt-tiivisteeseen. Onnistumisen jälkeen vanha vierasistunnon tunniste regeneroidaan. Tämä ehkäisee session fixation -hyökkäystä.”

“React saa vastauksena turvallisen käyttäjäobjektin, ei salasanaa, salasanatiivistettä eikä istuntotunnistetta.”

“Normaalissa käyttöliittymässä asiakas näkee vain My purchases -toiminnon. Kassan ja omistajan työkalut ovat piilossa. Tämä on rooliin mukautuva käyttöliittymä, ei vielä lopullinen autorisointi.”

## Mitä pitäisi näkyä

Role-aware workspace näyttää vain **My purchases** -painikkeen.

# Vaihe 5 Todista palvelinpuolen autorisointi

Arvioitu aika: 4 minuuttia.

## Mitä teet

1. Siirry **Teaching lab** -osioon.
2. Paina `GET /api/owner/report`.
3. Avaa Network-välilehdeltä sama pyyntö.
4. Paina myös `GET /api/cashier/sales`.
5. Paina lopuksi `GET /api/my-purchases`.

## Mitä sanot

“Vaikka normaali React-näkymä piilottaa omistajan napin, käyttäjä voi aina rakentaa pyynnön itse. Teaching lab tekee sen nyt meidän puolestamme.”

“Pyyntö todella saavuttaa Expressin. Palvelin tunnistaa asiakkaan, mutta `requireRole` havaitsee, ettei customer kuulu sallittuihin rooleihin.”

“Tässä näkyy luennon tärkein ero: Reactin piilotus parantaa käytettävyyttä. Expressin middleware tuottaa tietoturvan.”

## Mitä pitäisi näkyä

- Owner report: `403 — You are not allowed to perform this action.`
- Cashier sales: `403 — You are not allowed to perform this action.`
- My purchases: `200` ja taulukko, joka voi olla vielä tyhjä

Selitä: “`403` tarkoittaa, että käyttäjä tunnetaan mutta häneltä puuttuu oikeus. `401` tarkoittaa, ettei autentikoitua käyttäjää ole.”

# Vaihe 6 Tee kirjautunut osto ja näytä omistajuus

Arvioitu aika: 3 minuuttia.

## Mitä teet

1. Paina näytöksen painiketta **Book seat C7 to my account**.
2. Paina role-aware workspace -osiossa **My purchases**.
3. Näytä vastauksen `userId` ja `checkoutType: account`.
4. Avaa `server/src/app.js` ja etsi `/api/my-purchases`.

## Mitä sanot

“Kirjautuneen ostos liitetään palvelimella istunnosta saatuun käyttäjätunnukseen. Selain ei saa itse päättää, kenen ostos tämä on.”

“Pelkkä customer-rooli ei riitä. Palvelin suodattaa ostokset myös omistajuuden perusteella. Muuten asiakas voisi vaihtaa URL-osoitteessa ostoksen tunnisteen ja nähdä toisen asiakkaan tietoja.”

## Mitä pitäisi näkyä

Omat ostokset sisältävät juuri tehdyn ostoksen. Sisäistä `guestId`-kenttää ei näy.

# Vaihe 7 Avaa kirjautumiskoodi

Arvioitu aika: 5 minuuttia.

## Mitä teet

Avaa `server/src/app.js` ja näytä `POST /api/auth/login`. Etene koodissa tässä järjestyksessä:

1. sähköpostin normalisointi
2. käyttäjän haku
3. bcrypt-vertailu
4. yleinen virheilmoitus
5. `req.session.regenerate`
6. `publicUser`-objektin tallennus istuntoon

Avaa sitten `server/src/data.js` ja näytä `publicUser`.

## Mitä sanot

“Salasanaa ei pureta mistään. bcrypt vertaa annettua salasanaa tallennettuun tiivisteeseen.”

“Onnistuneen kirjautumisen jälkeen istuntotunniste vaihdetaan. Istuntoon tallennetaan vain demon tarvitsema turvallinen käyttäjäobjekti.”

“Tässä demossa käyttäjät ovat muistissa. Tuotannossa käyttäjä haetaan tietokannasta ja roolin muutoksen voimaantulo suunnitellaan erikseen. Palvelinistunto tekee istunnon mitätöinnistä suoraviivaista, mutta istuntoon kopioitu rooli voi silti vanhentua, ellei sitä päivitetä tai istuntoa mitätöidä.”

# Vaihe 8 Näytä middleware

Arvioitu aika: 4 minuuttia.

## Mitä teet

1. Avaa `server/src/auth.js`.
2. Näytä `requireAuthentication`.
3. Näytä `requireRole(...allowedRoles)`.
4. Palaa `server/src/app.js`-tiedostoon ja osoita middlewaret reittien edessä.

## Mitä sanot

“Middleware suoritetaan ennen varsinaista route handleria. Jos tarkistus epäonnistuu, funktio palauttaa vastauksen eikä kutsu `next()`-funktiota.”

“Kassan reitillä sallitaan cashier ja owner. Omistajan raportissa sallitaan vain owner. Sama uudelleenkäytettävä tarkistus suojaa useita reittejä.”

# Vaihe 9 Näytä istunnon säilyminen sivunpäivityksessä

Arvioitu aika: 2 minuuttia.

## Mitä teet

1. Päivitä selain.
2. Näytä, että asiakas on yhä kirjautunut.
3. Avaa `client/src/main.jsx` ja osoita `useEffect` sekä `/api/auth/me`.

## Mitä sanot

“Reactin muistitila häviää sivunpäivityksessä. Selain säilyttää evästeen ja lähettää sen `/api/auth/me`-pyynnön mukana. Express tunnistaa istunnon ja palauttaa julkiset käyttäjätiedot, joiden perusteella React rakentaa näkymän uudelleen.”

# Vaihe 10 Kokeile kassahenkilöä ja omistajaa

Arvioitu aika: 4 minuuttia.

## Mitä teet

1. Kirjaudu ulos.
2. Kirjaudu Cashier-tilillä salasanalla `demo1234`.
3. Näytä, että normaalissa työtilassa näkyy Cashier sales mutta ei Owner report.
4. Kutsu Teaching labista Owner report ja näytä `403`.
5. Kirjaudu ulos ja kirjaudu Owner-tilillä.
6. Näytä, että kaikki kolme normaalia toimintoa näkyvät ja palauttavat `200`.

## Mitä sanot

“Sama käyttäjä voi saada eri reiteiltä eri tuloksen. Kassahenkilö saa käyttää kassatoimintoja mutta ei omistajan raporttia. Omistaja kuuluu tässä yksinkertaisessa mallissa myös kassareitin sallittuihin rooleihin.”

“Todellisessa järjestelmässä roolit ja oikeudet mallinnetaan liiketoiminnan vaatimusten mukaan. Rooli ei automaattisesti tarkoita kaikkia alemman roolin toimintoja.”

# Vaihe 11 Kirjaudu ulos

Arvioitu aika: 2 minuuttia.

## Mitä teet

1. Paina **Sign out**.
2. Kutsu Teaching labista My purchases.
3. Näytä Network-välilehdeltä logoutin `204` ja seuraavan pyynnön `401`.

## Mitä sanot

“Uloskirjautuminen ei ole vain React-tilan tyhjentämistä. Palvelin tuhoaa istunnon ja selain tyhjentää evästeen. Seuraava suojattu pyyntö palauttaa jälleen `401`.”

# Vaihe 12 Aja testit

Arvioitu aika: 3 minuuttia.

## Mitä teet

Suorita VS Coden terminaalissa:

```powershell
npm test
```

Avaa `server/test/auth.test.js` ja näytä ainakin asiakkaan `403`-testi, kassahenkilön oikeustesti, vierasistunnon testi ja logout-testi.

## Mitä sanot

“Autorisoinnissa kielteiset testit ovat yhtä tärkeitä kuin onnistuneet testit. Emme testaa vain sitä, että omistaja pääsee raporttiin, vaan myös sitä, että asiakas ja kassahenkilö eivät pääse.”

# JWT-osuuden puherunko demon jälkeen

JWT:tä ei toteuteta demossa. Näytä PowerPointin JWT-diat ja sano:

“JWT on allekirjoitettu tokenformaatti, ei evästeen vastakohta. Se voidaan lähettää Authorization-otsakkeessa tai sijoittaa HTTP-only-evästeeseen. Allekirjoitettu ei tarkoita salattua.”

“Tässä yhden selainkäyttöliittymän ja yhden Express-palvelimen sovelluksessa satunnainen istuntotunniste HTTP-only-evästeessä on pienin tarkoitukseen sopiva ratkaisu. Opiskelijaryhmä saa käyttää JWT:tä, mutta sen pitää perustella tokenin säilytys, uusiminen, revokaatio, vanhenevat roolit sekä XSS- ja CSRF-suojaus.”

# Jos jokin menee demossa pieleen

## Sovellus ei käynnisty

Tarkista, että olet repositoryn juuressa. Suorita `npm install` ja sitten `npm run dev`. Jos portti on varattu, sulje vanha Node-prosessi tai terminaali.

## Käyttäjä on valmiiksi kirjautunut

Paina Sign out, tyhjennä sivuston evästeet tai avaa yksityinen selainikkuna.

## Ostoslista sisältää vanhoja ostoksia

Käynnistä Express-palvelin uudelleen. Demon data on muistissa ja tyhjenee uudelleenkäynnistyksessä.

## Evästeessä ei näy Secure tai __Host-etuliitettä

Tämä on odotettua paikallisessa HTTP-kehityksessä. Ominaisuudet aktivoituvat tuotantoasetuksessa HTTPS-yhteydellä.

## Aika loppuu

Jätä kassahenkilön ja omistajan täydellinen kierros väliin. Älä jätä pois vierasistunnon eroa, asiakkaan `403`-demonstraatiota, 401/403-erottelua tai palvelinpuolen middlewarea.

# Lopetus

Päätä demo näihin kolmeen lauseeseen:

> Autentikointi kertoo, kuka olet. Autorisointi kertoo, mitä saat tehdä. Selain pyytää, mutta palvelin päättää.
