# CURBSHIFT ZERO — plan konkursowy v1

## Jedno zdanie

CURBSHIFT pomaga miastu wybrać **zatwierdzony harmonogram** wykorzystania kilku miejsc przy ulicy: dostawy, krótki postój lub odbiór osób/zamówień — na podstawie lokalnego popytu, kalendarza wydarzeń i obserwacji, bez montowania czujników w każdym miejscu.

## Decyzje i założenia

- **Główny użytkownik:** miejski planista/zarządca drogi; mieszkaniec i dostawca są beneficjentami. Nie tworzymy na starcie ogólnopolskiej aplikacji do parkowania.
- **Pilot:** jeden odcinek w Krakowie, 2–3 zwykłe stanowiska postojowe przy lokalach. Konkretna ulica dopiero po sprawdzeniu istniejących znaków, dostaw, dostępności pieszej i bezpieczeństwa. Wykluczone są miejsca dla osób z niepełnosprawnością, przystanki, buspas i czynny pas ruchu.
- **Decyzja produktu:** zaproponować dwa możliwe harmonogramy dla zwykłego dnia oraz osobny scenariusz wcześniej zapowiedzianego wydarzenia. System niczego nie przełącza prawnie ani fizycznie samodzielnie.
- **Nowość do obrony:** działający, tani **silnik doboru godzin i funkcji** dla pojedynczych miejsc w warunkach braku czujników, z oceną niepewności i konfliktów. Samo czasowe współdzielenie krawężnika istnieje już na świecie.
- **Wdrożenie:** najpierw analiza i porównanie wariantów; potem decyzja miasta, projekt organizacji ruchu, czytelne oznakowanie oraz pomiar przed/po. Wyjątek na dzień wydarzenia wymaga wcześniejszego zatwierdzenia i komunikacji. Źródło procedury: https://www.gov.pl/web/gddkia/zatwierdzenie-projektu-organizacji-ruchu

## Korekta pomysłu z udostępnionej rozmowy

Nie wolno utożsamiać końca opłaconej sesji (np. 08:17) z faktycznym odjazdem auta. Dane z parkomatu/aplikacji, nawet jeśli miasto je udostępni, nie są automatycznie przypisane do konkretnego stanowiska i nie pokazują jego zajętości w czasie rzeczywistym. „Natural handoff” można **planować probabilistycznie**, lecz nie obiecywać potwierdzonego przełączenia bez obserwacji danego miejsca i zatwierdzonego oznakowania. Jeżeli auto stoi po godzinie zmiany, jest to przypadek do legalnej obsługi zgodnie ze znakami i zasadami egzekwowania, nie polecenie systemu usunięcia auta.

## Dane: co faktycznie istnieje, a co zbierzemy

| Dane | Skąd dokładnie | Dostęp i świeżość | Rola w systemie |
| --- | --- | --- | --- |
| Granice strefy płatnego parkowania | [MSIP: sektory SPP](https://msip.krakow.pl/dataset/1374) i [ZDMK: mapa i zasady](https://zdmk.krakow.pl/parkowanie/strefa-platnego-parkowania/mapy/mapa-strefy/) | publiczne, aktualizacja po zmianie regulacji; warstwa sektorów **nie** pokazuje pojedynczych miejsc ani zajętości | sprawdzenie, w jakich zasadach działa wybrana ulica |
| Miejsca dla osób z niepełnosprawnościami | [MSIP/ZDMK: zasób punktowy](https://msip.krakow.pl/dataset/3101) | publiczny opis mówi o codziennej aktualizacji przez usługę REST; warstwę i licencję trzeba technicznie sprawdzić przed pobieraniem | automatyczne wykluczenie z wariantów, potem kontrola terenowa |
| Inne otwarte warstwy przestrzenne | [MSIP: katalog pobierania](https://msip.krakow.pl/aktualnosci/324198,2053,komunikat,nowa_usluga_pobierania_danych_msip.html) | część zbiorów daje GeoJSON/SHP/WFS bez logowania; konkretne warstwy należy zweryfikować | mapa i kontekst; **nie** zakładać, że jest tam kompletny rejestr zwykłych miejsc |
| Wydarzenia | [miejski kalendarz](https://www.krakow.pl/kalendarium/) i kalendarz właściwego organizatora | publiczna strona; stabilnego oficjalnego API nie potwierdzono; termin/frekwencję w pilocie potwierdza organizator | znany wcześniej scenariusz zmiany popytu, nie sygnał do samowolnego przełączenia znaku |
| Miejski dowód skali problemu | [badanie mieszkańców Krakowa 2025](https://www.bip.krakow.pl/plik.php?mode=shw&new=t&wer=0&zid=603781) | 22,8% wskazań na brak parkingów; źródło historyczne, nie strumień operacyjny | uzasadnienie problemu, **nie** prognoza dla pilotowej ulicy |
| Geometria zwykłych stanowisk, znaki, chodnik, lokale | audyt własny jednego odcinka, weryfikacja z zarządcą drogi | pomiar punktowy i ponowna kontrola po zmianach | mapa 2–3 kandydackich stanowisk i twarde ograniczenia |
| Faktyczne zajęcie i sposób użycia | obserwacje zespołu/partnera: czas, stanowisko, pojazd zwykły/dostawczy, podwójny postój, brak miejsca | tylko w czasie pomiaru; bez stałego obserwatora nie jest realtime | historia do wyznaczania godzin i walidacji prognoz |
| Zapotrzebowanie dostawcze | dobrowolne okna dostaw i proste meldunki 2–5 lokali / firm; bez danych klienta | aktualizowane przez uczestników pilota; brak meldunku ≠ brak popytu | prognoza legalnych postojów i kontrola jej błędu |
| Płatności za parkowanie | ewentualne zagregowane szeregi czasowe od ZDMK po umowie i potwierdzeniu zakresu | **niepotwierdzony dostęp**; sesja opłaty nie oznacza zajętości konkretnego miejsca ani chwili odjazdu | tylko pomocniczy wskaźnik presji na parkowanie, nigdy wyzwalacz przełączenia miejsca |

**Warunki pozyskania:** dla każdego zbioru zapisać URL, licencję/warunki użycia, właściciela, znacznik aktualizacji, częstotliwość pobierania i wersję. Nie pobierać identyfikatorów pojazdów ani wizerunków osób. Jeśli zgłoszenia wymagają konta, przechowywać minimum danych i zgodę uczestnika.

## Zbieranie historii — realny pilotaż po hackathonie

1. **Tydzień 0: wybór ulicy i audyt.** Krótki odcinek z prawdziwym konfliktem dostawy–postój, bez miejsc wyłączonych, z możliwością bezpiecznej obserwacji. Sprawdzić znaki w terenie, liczbę lokali, zgodę/udział kilku z nich. Bez tego nie wybierać Tauron Areny tylko dlatego, że ma wydarzenia.
2. **Tygodnie 1–2: linia bazowa.** W kilku powtarzalnych porach dnia roboczego i w sobotę liczyć co 10–15 minut zajęte miejsca, liczbę prób dostawy, czas podwójnego postoju i odmówione/nieudane postoje; mierzyć też dłuższe epizody czasem rozpoczęcia i końca. Powtórzyć każdą porę w kilku dniach, zarejestrować pogodę i wydarzenia. Nie wnioskować o całym tygodniu z jednego dnia hackathonowego.
3. **Zbieranie okien dostaw:** lokale podają typowe godziny i dobrowolnie oznaczają przyjazd/odjazd dostawcy prostym formularzem lub kodem QR. Obserwator sprawdza część zgłoszeń; brak zgłoszeń i odstępstwa zapisujemy, aby ocenić obciążenie błędem selekcji.
4. **Pierwsza prognoza:** prosta tabela popytu według dnia tygodnia i 15/30-minutowego przedziału oraz funkcji miejsca. Model pokazuje liczność próby i przedział niepewności. Dla eventu bez wcześniejszych podobnych dni stosować scenariusz od organizatora, nie udawać wytrenowanej predykcji.
5. **Po zatwierdzeniu zmiany przez miasto:** analogiczny pomiar przez następne tygodnie w porównywalnych dniach; odnotować pogodę i wydarzenia, żeby nie przypisać ich wpływu harmonogramowi.

## Aktualizacja na bieżąco po uruchomieniu

- **Miejskie warstwy i przepisy:** sprawdzenie zmian raz dziennie/tygodniowo według faktycznej częstotliwości źródła. Zmiana znaku w terenie wymaga ponownej weryfikacji — system nie uznaje automatycznie starej mapy za aktualną.
- **Wydarzenia:** import z potwierdzonego kalendarza/od organizatora co najmniej codziennie przed wydarzeniem; odwołanie lub zmiana godziny aktualizuje prognozę, lecz nie zmienia prawnie obowiązującej organizacji ruchu.
- **Dostawy:** nowe dobrowolne okno lub check-in od lokalu/dostawcy aktualizuje prognozę popytu od razu. Zgłoszenie ma czas powstania i wygaśnięcia; nie potwierdza zajętości wszystkich stanowisk.
- **Zajętość stanowiska:** tylko świeży meldunek obserwatora/partnera daje status „potwierdzone o HH:MM” dla danego miejsca; po ustalonym krótkim czasie, np. 5 minut, status przechodzi na „nieznane”. W pozostałym czasie pokazujemy **prawdopodobieństwo**, nie „wolne/zajęte”.
- **Uczenie z historii:** surowe zdarzenia trafiają do bazy z oznaczeniem źródła; agregaty aktualizują się codziennie, parametry prognozy po zebraniu kolejnych porównywalnych dni, np. raz na tydzień. Raport błędu prognozy decyduje, czy wariant można rekomendować. Przez 24 godziny hackathonu nie powstanie wiarygodny model dla dni roboczych i eventów.
- **Tryb awaryjny:** gdy źródło znika lub meldunek się starzeje, system zachowuje ostatni **zatwierdzony** harmonogram i ukrywa deklarację bieżącej zajętości. Nie przełącza funkcji fizycznie.

## Logika prototypu

1. Wczytaj 3 stanowiska, dostępne funkcje i stałe ograniczenia prawne/bezpieczeństwa.
2. Ustal popyt w blokach czasu z obserwacji; brakujące bloki oznacz jako założenia lub scenariusze.
3. Wygeneruj kilka prostych harmonogramów, np. 07–10 dostawy, 10–17 krótki postój, 17–22 odbiór. Liczba godzin i miejsc jest przykładowa, nie gotową decyzją dla ulicy.
4. Porównaj warianty: obsłużone dostawy, minuty ryzykownego/podwójnego postoju, dostęp dla zwykłych kierowców, dojście kuriera, konflikt z pieszymi, liczba zmian oznakowania.
5. Pokaż wynik, dane wejściowe, scenariusz wydarzenia, niepewność i decyzję **„do oceny przez miasto”**. Wersja eventowa wymaga planu ogłoszonego wcześniej.

Do MVP wystarczą jawne reguły i enumeracja wariantów. Model AI nie jest konieczny; może później pomagać klasyfikować zgłoszenia, ale nie zastępuje danych ani decyzji zarządcy.

## Zgodność ze źródłowym briefem SMART CITY

| Wymóg briefu | Jak go pokazujemy |
| --- | --- |
| Konkretny problem miasta/mieszkańców | brak legalnego miejsca na dostawę w godzinach szczytu, podwójny postój i konflikt o kilka stanowisk; weryfikowany audytem jednej ulicy |
| Użytkownik i lepsze użycie zasobów | planista wybiera harmonogram; lokale/dostawcy/mieszkańcy korzystają z tej samej przestrzeni w różnych porach |
| Narzędzie/system/prototyp | działająca mapa 2–3 miejsc, model wariantów, ekran porównania i status danych |
| Konkretna sytuacja | zwykły dzień kontra wcześniej zapowiedziane wydarzenie w pobliżu |
| Accuracy i timeliness | każdy rekord ma źródło, `observed_at`, `received_at`, status pomiar/prognoza/scenariusz i czas wygaśnięcia; status miejsca staje się „nieznany” po utracie świeżego potwierdzenia |
| Łatwość użycia | jedna główna decyzja: „który wariant przekazać miastu do rozpatrzenia?” plus widoczne koszty dla innych użytkowników |
| Test w realnych warunkach | 2 tygodnie pomiaru bazowego, ewentualne zatwierdzenie organizacji ruchu, potem porównywalny pomiar po zmianie |

Podział prac: podczas HackYeah budujemy prototyp i audytujemy dostępną ulicę; długookresowy zbiór danych i fizyczna zmiana są **planem pilotażu**, nie wynikiem 24 godzin. Źródłowy PDF dopuszcza prototyp dla jednej ulicy i wymaga ujawnienia istotnych danych, API, bibliotek oraz użycia AI. PDF wskazuje Challenge Rocket, a przekazany osobno tekst regulaminu HackTribe; kanał ostatecznego zgłoszenia należy ustalić na podstawie aktualnego komunikatu organizatora.

## Demo dla jury: 90 sekund

1. Mapa krótkiego odcinka: dostawca staje podwójnie, choć jedno miejsce bywa wolne w innych godzinach. Ekran pokazuje, które zdarzenia są **zaobserwowane**, a które są scenariuszem.
2. Planista wybiera „dzień zwykły” i „dzień wydarzenia”; aplikacja pokazuje dwa harmonogramy i trade-off: dostawy vs postój klientów vs odbiór. Zmiana parametru naprawdę przelicza wynik.
3. Po kliknięciu miejsca widać regułę, źródło, czas aktualizacji, poziom pewności i konflikt prawny/bezpieczeństwa. Jeśli zajętość nie jest znana, wyświetla się „nieznana”.
4. Operator wybiera wariant do oceny. Ekran końcowy: propozycja planu, wymagane zatwierdzenie i metryki przyszłego pilotażu.

## Pitch i demo dla jury — wersja do 2 minut

**Zdanie na otwarcie (10–15 s):** „Na tej ulicy te same trzy miejsca są potrzebne rano dostawcom, po południu klientom, a przy wydarzeniu osobom odbieranym po jego zakończeniu. Dziś obowiązuje jeden układ. CURBSHIFT pokazuje miastu, kiedy warto go zmienić, na podstawie obserwacji, a nie czujników w asfalcie.” Słowa „dziś” i „obserwacji” użyć tylko po audycie realnej ulicy; do tego czasu oznaczyć sytuację jako scenariusz.

| Czas | Ekran i akcja prowadzącego | Co jury ma zrozumieć |
| --- | --- | --- |
| 0–20 s | zdjęcie/krótka mapa **jednego zweryfikowanego odcinka**, 2–3 miejsca, jeden zaobserwowany konflikt dostawy–postój; pokaz źródła i daty obserwacji | konkretny problem i miejsce, nie ogólna platforma |
| 20–45 s | oś czasu zwykłego dnia; wybór 8:00, system pokazuje obecną funkcję i zarejestrowane/przewidywane zapotrzebowanie z różnymi etykietami | dane mają pochodzenie, a prognoza nie udaje pomiaru |
| 45–70 s | włączenie **wcześniej zapowiedzianego wydarzenia**; scenariusz popytu zmienia się, aplikacja porównuje dwa warianty godzin dla miejsc | jedna przyczyna zmienia decyzję, widać mechanizm |
| 70–95 s | kliknięcie „porównaj”: dostawy obsłużone legalnie, minuty podwójnego postoju, postój klientów/mieszkańców i konflikt z pieszymi; wartości obserwowane oddzielone od szacowanych | widoczny trade-off, nie magiczna redukcja emisji |
| 95–120 s | wybór wariantu → „propozycja do zatwierdzenia”: godziny, miejsca, uzasadnienie, ograniczenia danych i kroki urzędowe | droga do wdrożenia oraz działający wynik prototypu |

**Zasada demo:** prawdziwe dane mapy, znaków i wydarzeń + choć krótki autentyczny pomiar. Jeżeli brak obserwacji dnia roboczego, pokazać go jako „symulacja demonstracyjna”, nie jako fakt. Nie pokazywać automatycznego przełączenia znaku, „potwierdzonego wolnego miejsca” z danych parkomatu ani redukcji CO₂ bez pomiaru. Liczby efektu w prototypie to *prognozowane różnice scenariuszy* z jawnie podanym założeniem.

**Wizualny haczyk:** jedna niezmienna mapa ulicy, na której przesunięcie zegara i włączenie wydarzenia przerysowują przeznaczenie miejsc oraz słupki korzyści/kosztów. Priorytetem jest czytelność tej jednej decyzji, nie wiele funkcji aplikacji.

## Test i kryterium sukcesu

- **Hackathon:** sprawdzić, czy silnik poprawnie respektuje ograniczenia i zmienia ranking po zmianie danych; 2–3 krótkie testy użyteczności z osobami spoza zespołu; ujawnić dane symulowane.
- **Pilot w mieście:** kilka tygodni obserwacji przed i po ewentualnym zatwierdzeniu, w porównywalnych dniach. Mierzyć minuty podwójnego postoju, liczbę dostaw obsłużonych legalnie, czas szukania miejsca, konflikty z pieszymi i opinie lokali/mieszkańców.
- **Eko:** mierzyć/prognozować kilometry szukania miejsca i czas blokowania pasa; emisje liczyć dopiero z jawnego modelu i danych. Możliwy efekt ujemny, jeśli poprawa parkowania przyciągnie więcej aut.

## Materiał konkursowy — maks. 10 slajdów

1. Problem i jedna ulica.
2. Dane z Krakowa + własny audyt.
3. Użytkownik i decyzja.
4. Dzień zwykły vs wydarzenie.
5. Działające demo.
6. Jak działa ranking i jak oznaczamy niepewność.
7. Wynik wariantów i trade-off.
8. Wdrożenie: miasto → zatwierdzenie → oznakowanie → pomiar.
9. Koszt, ryzyka, mierniki pilotażu.
10. Zespół, użyte dane/AI/biblioteki, linki do repo/demo.

Regulamin i brief: `SMART_CITY_RULES_AND_ASSUMPTIONS.md`. Odróżniać własny prototyp od pełnego wdrożenia, pomiary od scenariuszy oraz publiczne dane od danych wymagających dostępu.
