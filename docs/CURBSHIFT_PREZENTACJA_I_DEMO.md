# CURBSHIFT — prezentacja konkursowa i demo

Plan z 3 października 2026. Brief: [Details - SMART CITY.pdf](<Details - SMART CITY.pdf>). Maksymalnie 10 slajdów PDF. Cel: pokazać konkretny problem, użytkowników, działający rdzeń, dokładność/aktualność, łatwość użycia i możliwość testowania. Gotowość do fizycznego wdrożenia nie jest warunkiem prototypu.

## Jedno zdanie produktu

„CURBSHIFT uczy się nie tylko, kto zajął miejsce, ale też komu go zabrakło — i proponuje, kiedy ta sama zatoka powinna służyć dostawom, parkowaniu albo krótkiemu odbiorowi.”

## Prezentacja: 8 slajdów, czytelna bez wystąpienia

| Nr | Treść i wizualizacja | Co ma zapamiętać jury |
| --- | --- | --- |
| 1 | **Trzy funkcje, jedna zatoka.** Ta sama uproszczona ulica rano/w dzień/po wydarzeniu. Tytuł, zespół, członkowie. | Przestrzeń zmienia użycie wraz z rytmem miasta. |
| 2 | **Problem potwierdzony przez miasto.** Warszawski ZDM w 2018 r. naliczył 111 dostaw poza miejscami zastrzeżonymi w dwa dni badania na ul. Świętokrzyskiej od Ronda ONZ do Nowego Światu; 65–69% tych postojów było niezgodnych z przepisami. Duża etykieta „2018, dane historyczne”. [Raport ZDM](https://zdm.waw.pl/wp-content/uploads/2018/04/Raport_koncowy_Swietokrzyska_dostawy.pdf). | To konkretny konflikt, nie fikcyjny problem. |
| 3 | **Dlaczego sama stała godzina nie wystarcza.** ZDM oznaczył dziewięć miejsc dla dostaw 6–18; raport nie stwierdził korelacji między ich zajętością a dostawami poza nimi. Lokalizacja, wymiary i dostępność też są istotne. [Komunikat ZDM](https://zdm.waw.pl/aktualnosci/koperty-dla-dostawcow-na-swietokrzyskiej/), [raport](https://zdm.waw.pl/wp-content/uploads/2018/04/Raport_koncowy_Swietokrzyska_dostawy.pdf). | Nie obiecujemy, że przesunięcie godzin samo naprawi ulicę. |
| 4 | **Dwa proste wejścia.** Ekran dostawcy i kierowcy: cel, czas przyjazdu, długość postoju; dostawca dodaje gabaryt. Osobno zgłoszone wydarzenie. | Aplikacja rozumie różne potrzeby ludzi. |
| 5 | **Silnik decyzji.** Mapa przepływu: historia + zgłoszenia + nieudane wyszukiwania + wydarzenie + zajętość → 2–3 warianty → porównanie obsłużonych/nieobsłużonych próśb → zaplanowana zmiana. | Wyróżnik to popyt niezaspokojony i jawna decyzja. |
| 6 | **Produkt w użyciu.** Duże zrzuty: oś czasu zatoki, widok kierowcy, widok oznakowania. Rozróżnienie „teraz” i „od godziny X”; status `pomiar / zgłoszenie / prognoza / nieznane`. | Każdy wie, co obowiązuje i na ile pewne są dane. |
| 7 | **Co działa w prototypie.** Jedna ulica, 2–3 modelowe zatoki, trzy scenariusze, działające przeliczenie po zmianie wejść. Jawny wykaz: miejskie dane historyczne, testowe zgłoszenia, symulowany event, makieta oznakowania. Krótki link/QR do demo i repozytorium. | Jest techniczny rdzeń, nie tylko makiety. |
| 8 | **Jak sprawdzić sens w mieście.** Przed/po: nieobsłużone prośby, minuty blokowania ruchu, czas szukania, błędne rekomendacje. Bez procentów CO₂ bez pomiaru. Jako następny krok: lokalny audyt aktualnych miejsc. W stopce istotne źródła, użyte API/AI i informacje licencyjne. | Wiemy, jak odróżnić efekt od wizji. |

Deck ma być samodzielny w pierwszej fazie oceny. Na slajdach 2–3 duże liczby z pełnym mianownikiem i datą. Jeden system kolorów oraz podpisy ikon, by znaczenie było czytelne także bez rozróżniania barw. Nie wpisywać niezweryfikowanego numeru aktualnej zatoki w Warszawie.

## Demo: 90 sekund, z wersją 30-sekundową

**Ustawienie:** przeglądarkowy prototyp z ulicą schematyczną, trzema zatokami A–C i zegarem scenariusza. ZDM 2018 pojawia się jako **historyczny kontekst problemu**, nie bieżący pomiar. Popyt demonstracyjny pochodzi z oznaczonych zgłoszeń testowych/symulacji. Wszystkie liczby wyników opisane „wynik symulacji prototypu”.

| Czas | Akcja prowadzącego | Oczekiwany widoczny skutek |
| --- | --- | --- |
| 0–15 s | Otwiera „zwykły dzień”. | Na osi czasu A–C widać dwa tryby, bieżącą funkcję i nieobsłużone prośby. |
| 15–35 s | Wysyła zgłoszenie dostawy na rano w czasie, gdy plan faworyzuje parking. | Prośba zostaje przyjęta lub oznaczona jako nieobsłużona; miasto widzi, dlaczego. Nic nie przełącza się wstecz. |
| 35–55 s | Dodaje kilka **oznaczonych zgłoszeń testowych** dostaw w podobnym oknie. Naciska „porównaj warianty”. | Przelicza się prognoza i dwa harmonogramy. Widać, ilu dostawców zyskuje i ilu kierowców traci możliwość postoju. |
| 55–75 s | Dodaje **symulowane wydarzenie** z końcem wieczorem. | Propozycja przyszłego okna odbioru oraz aktualizacja widoku aplikacji i znaku. Ekran pokazuje wyprzedzenie przed zmianą. |
| 75–90 s | Włącza scenariusz „zatoka zajęta / dane niepewne”. | Silnik odmawia natychmiastowej zmiany lub pokazuje brak potwierdzonej dostępności i alternatywę. |

**Wersja 30 s:** stan zwykły → dodanie popytu dostaw i wydarzenia → jeden ekran porównania wariantów i widok „teraz / później” → komunikat: „Uczymy się także z odmów, nie tylko z zajętych miejsc”.

## Warunki wiarygodnego pokazu

- Kliknięcie zmienia obliczony wynik, nie tylko przygotowany obrazek. Algorytm ma być możliwy do wyjaśnienia bez czarnej skrzynki.
- Nigdy nie pokazywać `wolne` na podstawie samego biletu z parkomatu lub braku zgłoszeń. Dostępność może być `potwierdzona`, `szacowana` albo `nieznana`.
- ZDM 2018 jest wiarygodnym dowodem historycznego problemu, ale nie oznacza aktualnego stanu 2026 ani mierzalnej redukcji emisji.
- „Oznakowanie” w demo jest wizualizacją; fizyczny pilotaż jest osobnym krokiem miasta.
- Przygotować lokalną kopię demonstracyjnych wejść i krótkie nagranie jako zabezpieczenie przed awarią internetu. Nie przedstawiać nagrania jako działania live.

## Dwa zdania do pitchu

„Miasta wyznaczają godziny dostaw, ale nie widzą wszystkich, którzy nie znaleźli miejsca. CURBSHIFT zbiera także ten niezaspokojony popyt, porównuje warianty użycia zatoki i pokazuje kierowcom z wyprzedzeniem, komu będzie ona służyć.”

**Nie obiecywać:** automatycznego prawa do postoju z aplikacji, wolnego konkretnego stanowiska bez pomiaru, oszczędności CO₂ bez testu, aktualności warszawskiego badania z 2018 r.
