# CURBSHIFT — mechanizm decyzji i funkcjonalności

Wersja koncepcyjna: 3 października 2026. Źródłem wymagań konkursowych jest [Details - SMART CITY.pdf](<Details - SMART CITY.pdf>) (strony 1–4). Poniższe parametry czasu są projektowymi punktami startu do testu, nie aktualnymi zasadami żadnej ulicy.

## 1. Decyzja produktowa

CURBSHIFT zarządza **istniejącymi, wskazanymi zatokami** na jednym krótkim odcinku. Tryby: `DOSTAWA`, `PARKING`, `ODBIÓR`. Kierowca podaje cel, planowany przyjazd i czas postoju; aplikacja wskazuje legalnie pasujące miejsce i pokazuje pewność dostępności. Operator widzi propozycję funkcji zatok na przyszłe przedziały. System nie rezerwuje automatycznie publicznego miejsca i nie obiecuje, że zgłoszenie daje prawo wyłączności.

Wyróżnik: decyzja bierze pod uwagę zarówno **popyt obsłużony**, jak i **popyt odrzucony** (kto szukał miejsca, ale go nie dostał). Sama zajętość zaniża potrzebę grupy wykluczonej przez bieżący tryb.

## 2. Trzy horyzonty

1. **Uczenie lokalnego rytmu — tygodnie.** Rozkłady przyjazdów i czasów postoju według dnia, godziny, rodzaju potrzeby; osobno dni wydarzeń. Początek może być prostym licznikiem i średnią z przedziałem niepewności, bez AI. Korekta na podstawie błędów prognozy i okresowych obserwacji ulicy, które obejmują osoby niekorzystające z aplikacji.
2. **Przydział funkcji — następne godziny.** Co kilka minut system przelicza *przyszłe* okna z dostępnych wariantów. Proponowany punkt startu prototypu: okna 30-minutowe, co najmniej 30 minut wyprzedzenia i maksymalnie 2–3 zmiany trybu na dzień. Ostateczne parametry wymagają pomiaru i decyzji miasta.
3. **Informacja dla użytkownika — teraz.** Aplikacja sprawdza aktualny tryb, zgłoszone/potwierdzone zajęcie, ograniczenia pojazdu i czas postoju. Zwraca miejsce, alternatywę albo „brak potwierdzonej dostępności”. Aktualny tryb nie zmienia się osobie podczas prawidłowo zaplanowanego postoju.

## 3. Dane i poziom zaufania

| Sygnał | Co mówi | Czego nie dowodzi |
| --- | --- | --- |
| Inwentaryzacja zatok i oznakowania | Gdzie postój może być dopuszczony, wymiary i tryby | Czy miejsce jest teraz wolne |
| Zgłoszenie planowanego przyjazdu i czasu | Popyt przed podróżą | Że użytkownik faktycznie przyjedzie |
| Wyszukanie bez dostępnego miejsca | Niezaspokojony popyt w aplikacji | Całego popytu na ulicy |
| Check-in/check-out, opcjonalny czujnik | Potwierdzone użycie przez część pojazdów | Pełnej zajętości, jeśli nie ma czujnika/obserwacji |
| Okresowe obserwacje terenowe | Użycie również przez osoby spoza aplikacji | Ciągłego stanu na żywo |
| Harmonogram wydarzenia | Możliwy wzrost popytu na odbiór | Faktycznej frekwencji i dokładnej godziny odpływu |
| Dane parkomatów, jeśli partner je udostępni | Trend opłaconych postojów | Zajętości konkretnej zatoki |

Każdy sygnał ma `źródło`, `czas`, `obszar`, `typ: pomiar/zgłoszenie/prognoza`, `termin ważności`. Spóźniony lub niewiarygodny sygnał traci wagę. Nieobecność zgłoszeń nie oznacza zerowego popytu.

## 4. Mechanizm wyboru

**A. Filtr twardy.** Odrzuć warianty niezgodne z dopuszczonymi funkcjami, wymiarami pojazdu, ochroną pieszych/rowerzystów, już ogłoszonymi zasadami i trwającymi postojami. Miejsca dla osób z niepełnosprawnością, przystanki i czynny pas ruchu nie są pulą elastyczną.

**B. Prognoza.** Dla każdego przyszłego okna oszacuj liczbę przyjazdów i rozkład czasu postoju dla trzech trybów. Połącz historię, świeże zgłoszenia, odrzucone wyszukiwania i zweryfikowane wydarzenia. Pokazuj zakres niepewności. Gdy danych mało, większa rola bazowego rytmu i zachowawczej reguły.

**C. Symulacja niewielu wariantów.** Porównaj: dotychczasowy plan, przesunięcie początku/końca okna, dodatkowe okno dostaw, krótkie okno odbioru po wydarzeniu. Dla każdego wariantu zasymuluj, ilu użytkowników znajdzie pasujące miejsce, ile popytu pozostanie bez miejsca, jak daleko są alternatywy oraz ile razy zmieni się oznakowanie.

**D. Ocena skutków.** Minimalizuj *ważony niezaspokojony popyt* i koszt zamieszania przy zbyt częstych zmianach. Wagi są jawne: miasto może wyżej ocenić dostawę, jeśli jej brak częściej powoduje blokowanie jezdni, ale potrzebne są obserwacje, aby to potwierdzić. Nie wygrywa automatycznie grupa z największą liczbą kliknięć ani z największą sumą minut postoju. Pokaż, ilu dostawców, parkujących i odbierających obsłuży wariant oraz kto straci dostęp.

**E. Próg zmiany.** Jeśli wariant tylko minimalnie przewyższa dotychczasowy plan albo prognoza jest niepewna, zachowaj plan. Zmiany dotyczą przyszłych okien z czasem na poinformowanie kierowców. W prototypie decyzję zatwierdza operator; w docelowym systemie automatyzacja może działać tylko w ramach dopuszczonych scenariuszy.

**F. Pętla uczenia.** Po oknie porównaj prognozę z check-inami, obserwacją zajętości, liczbą nieobsłużonych próśb i no-show. Aktualizuj model, ale nie ucz go z samych kliknięć aplikacji. Osobno zapisuj wyniki dla dni zwykłych i wydarzeń.

Stan decyzji: `PROPOZYCJA → ZATWIERDZONE → OGŁOSZONE → AKTYWNE → ZAKOŃCZONE`. Przy utracie danych lub rozbieżności znaku i aplikacji użytkownik widzi „nieznane”, a system nie sugeruje nowego prawa do postoju.

## 5. Przypadki użycia i zachowanie systemu

| Sytuacja | Zachowanie |
| --- | --- |
| Poranny szczyt zgłoszeń dostaw | Rozważa dłuższe/przesunięte okno dostaw; pokazuje utratę zwykłych postojów. |
| Popołudnie z małą liczbą dostaw | Rozważa parking, ale uwzględnia historyczne dostawy spoza aplikacji. |
| Dostawa podczas trybu parkingowego | Wskazuje pasującą legalną alternatywę; rejestruje niezaspokojony popyt do kolejnej decyzji. Nie przełącza zajętej zatoki natychmiast. |
| Samochód stoi, zbliża się zmiana trybu | Nie przyjmuje nowego postoju, który przekroczyłby okno; pokazuje następny tryb. Jeśli pojazd zostanie, oznacza zatokę jako zajętą/niepewną. |
| Wiele dostaw i wielu parkujących jednocześnie | Porównuje wynik kilku podziałów czasu i pokazuje utracony popyt obu grup; nie udaje pełnego zaspokojenia. |
| Wydarzenie kończy się później lub jest odwołane | Przelicza przyszłe okno odbioru; nie zmienia już aktywnej reguły bez ogłoszenia. |
| Nagłe zgłoszenie dużego pojazdu | Wyklucza za małe miejsca, nawet gdy są wolne. |
| Brak zgłoszeń | Używa historii i pokazuje niską pewność, nie uznaje popytu za zerowy. |
| Wielu użytkowników zgłasza zamiar, ale nie przyjeżdża | Zgłoszenia wygasają; model obniża ich przyszłą wagę, bez automatycznego wykluczania użytkownika. |
| Ktoś próbuje sztucznie zawyżyć popyt | Ogranicza liczbę aktywnych zgłoszeń, wymaga check-inu do uczenia; anomalie nie uruchamiają nagłej zmiany. |
| Brak czujnika lub awaria | Zajętość staje się „nieznana”; aplikacja nie pokazuje „wolne”. |
| Zamknięcie ulicy, prace, zagrożenie | Operator wyłącza zatokę; użytkownicy dostają alternatywę. |
| Miejsce o szczególnej funkcji | Nie trafia do puli przełączanej; ograniczenia są twarde. |
| Wszystkie miejsca pełne | Komunikat „brak potwierdzonego miejsca” i najbliższa legalna alternatywa, bez fikcyjnej rezerwacji. |
| Konflikt zgłoszeń na granicy dwóch okien | Priorytet ma możliwość zakończenia legalnego postoju przed zmianą; następne prośby przesuwa się lub odrzuca. |

## 6. Funkcjonalności interfejsu

**Kierowca:** dwa-trzy pola do wpisania celu, czasu i długości postoju; mapa miejsc dopuszczalnych; obecny/następny tryb; status `potwierdzone wolne / zgłoszone zajęcie / nieznane`; krótka przyczyna rekomendacji; przyjazd, odjazd, alternatywa i powiadomienie o zmianie planu.

**Dostawca:** jak wyżej, lecz z typem i rozmiarem pojazdu, czasem rozładunku, lokalizacją odbiorcy oraz możliwością zgłoszenia nieudanej próby. Widzi legalny limit czasu i dojście do celu.

**Operator miasta:** oś popytu i podaży, liczba nieobsłużonych próśb, trzy warianty harmonogramu z korzyściami i stratami dla każdej grupy, pewność źródeł, zatwierdzenie/odrzucenie, stan zatoki, ręczne wyłączenie oraz historia decyzji. Widok znaku i aplikacji zawsze zgodny z aktywnym trybem.

## 7. Rdzeń demonstracji

Jedna schematyczna ulica i 2–3 zatoki. Trzy scenariusze uruchamiane na żywo: zwykły dzień, nagły wzrost dostaw, koniec wydarzenia. Zmiana wejścia naprawdę przelicza popyt, rekomendację, liczbę nieobsłużonych próśb i widok przyszłego oznakowania. Fakty historyczne miasta, własne testowe zgłoszenia i dane symulowane muszą być rozdzielone etykietami. Pokazać także przypadek, w którym silnik **odmawia zmiany** z powodu zajętego miejsca lub zbyt niepewnych danych.

Mierniki pilotażu: trafność prognozy popytu i zajętości, liczba nieobsłużonych próśb, minuty postoju blokującego ruch, czas szukania miejsca, długość dojścia dostawcy, liczba zmian trybu, błędne rekomendacje. Efekt CO₂/NOx wyłącznie po osobnym pomiarze pracy przewozowej; nie jest wynikiem samego modelu.

## 8. Materiał odniesienia

- [SFMTA: dual-use zones](https://www.sfmta.com/getting-around/drive-park/loading-and-short-term-parking/dual-use-zones) potwierdza sens różnych funkcji jednego miejsca o różnych porach, ale nie jest dowodem skuteczności naszego algorytmu.
- [NYC DOT: Smart Curbs](https://www.nyc.gov/html/dot/html/pr2024/smart-curbs-program-launch.shtml) pokazuje, że miasta testują takie zastosowania przestrzeni.
- [PNNL: dynamic curb zoning](https://www.pnnl.gov/publications/optimal-centralized-dynamic-curbside-parking-space-zoning) uzasadnia podejście: optymalizacja po przyszłych oknach z ograniczeniami polityki i kosztem zbyt częstych zmian. Nasz prosty silnik kandydatów jest propozycją na potrzeby prototypu, nie kopią ich modelu.

## 9. Dodawanie wydarzeń — zweryfikowane źródła miejskie

- **Kraków:** [BIP: lista imprez masowych 2026](https://www.bip.krakow.pl/?dok_id=239845&metka=1) podaje datę, godziny rozpoczęcia/zakończenia (nie dla każdego wydarzenia obie), nazwę, miejsce i **maksymalną liczbę uczestników z decyzji**, nie rzeczywistą frekwencję. Publicznego API tej konkretnej listy nie potwierdzono; prototyp może mieć jawny import danych z tabeli lub ręczne wprowadzenie rekordu z linkiem źródłowym.
- **Warszawa:** oficjalny [poradnik Mostu Danych](https://um.warszawa.pl/documents/120376751/130828415/Most_Danych_Poradnik_API.pdf/1eec2df3-5a48-fec2-ddce-8fb980353f50?t=1743583759706) opisuje bazę „Wydarzenia kalendarz” przez API, częściowo z kluczem; dostępność konkretnego endpointu i pełność wydarzeń trzeba sprawdzić przy implementacji. Miasto publikuje też [spis imprez masowych](https://xyz.um.warszawa.pl/B/Bezpieczna/Widget/widget.php) z datą, godzinami, adresem i liczbą uczestników; sposób automatycznego pobierania tej tabeli nie został potwierdzony.
- W aplikacji każde wydarzenie przechowuje źródło, miejsce, planowany start/koniec, czas pobrania, status `planowane/potwierdzone/odwołane` i jakość danych. Tylko wydarzenia w rzeczywistej strefie oddziaływania wybranej zatoki stają się sygnałem. Wydarzenie **podnosi prognozę potencjalnego popytu**, ale samo nie przełącza trybu; potrzebne są zgłoszenia odbiorów albo potwierdzenie operatora/organizatora. Godzina w kalendarzu nie jest pomiarem faktycznego końca, a liczba dopuszczonych uczestników nie jest liczbą osób zamawiających odbiór.
