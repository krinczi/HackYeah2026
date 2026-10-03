# CURBSHIFT — plan aplikacji na HackYeah

Stan planu: 3.10.2026. Zakres konkursowy oparty na [Details - SMART CITY.pdf](<Details - SMART CITY.pdf>) (konkretny problem i użytkownicy; dokładność/aktualność informacji; użyteczność; design; testowalność; maks. 10 slajdów PDF). To plan produktu i demonstracji, bez szczegółowej architektury.

## Decyzja o produkcie

Jedna responsywna aplikacja webowa dostępna z linku i QR, z trzema perspektywami: kierowca, dostawca, miasto. Pilotażowy ekran obejmuje jeden krótki odcinek i 2–3 modelowe zatoki. Źródło warszawskiego badania z 2018 r. uzasadnia problem; lokalizacja i stan obecnych pojedynczych zatok wymagają weryfikacji. Interaktywne zgłoszenia i wydarzenie w demo mają etykietę danych demonstracyjnych. Aplikacja proponuje funkcję na przyszłe okno i prowadzi użytkownika według funkcji aktualnej.

**Moment, który zapamięta jury:** juror otwiera QR i wpisuje „dostawa, 11:30, 15 min”. Na ekranie miasta natychmiast pojawia się niezaspokojona prośba, zmienia się porównanie wariantów, a po zatwierdzeniu przyszły plan jest widoczny w telefonie użytkownika. Całość ma pozostać czytelna bez tłumaczenia algorytmu.

## Ekrany i interakcje

1. **Start / jedna decyzja:** „Gdzie i kiedy chcesz się zatrzymać?”; trzy wyraźne wybory `Dostawa`, `Parking`, `Odbiór`. Bez logowania w demonstracji.
2. **Prośba:** cel na mapie, przewidywany przyjazd, czas postoju; dla dostawcy również gabaryt pojazdu. Jedno kliknięcie „Znajdź miejsce”.
3. **Wynik:** maksymalnie trzy propozycje, każda z dystansem pieszo, dopuszczalnym czasem, aktualną i następną funkcją, źródłem/czasem statusu. Gdy brak miejsca, komunikat bez obietnicy dostępności i najbliższa alternatywa. Akcje `Zgłoś przyjazd`, `Odjeżdżam`, `Miejsce było zajęte`.
4. **Panel miasta:** dominująca wizualizacja to **wstęga ulicy**: zatoki A–C narysowane wzdłuż osi czasu. Pod nią popyt trzech grup i próśby odrzucone. Dwa warianty przyszłego planu pokazują obsłużone/nieobsłużone próśby oraz liczbę zmian. Operator klika `Wybierz wariant`.
5. **Karta wydarzenia:** nazwa, miejsce, planowane godziny, źródło, czas pobrania; możliwość korekty końca/odwołania. Wydarzenie jest sygnałem popytu, nie samodzielną komendą do przełączenia.
6. **Widok zatoki/oznaczenia:** `TERAZ: DOSTAWY`, `OD 12:00: PARKING`, dopuszczalny czas i status zajętości. W demo jest to ekran produktu, nie fizyczny znak.
7. **Tryb jury:** jedno kliknięcie `Uruchom przykład`, krótkie wskazówki w interfejsie i `Reset scenariusza`. Link do testu działa bez wiedzy o projekcie. Sala prezentacyjna może użyć kodu/QR do wspólnej sesji, a samodzielni oceniający dostają osobną kopię stanu.

## Rdzeń funkcjonalny — priorytet

**Musi działać:** zapis zgłoszenia i nieudanej próby, dopasowanie legalnie pasującej zatoki, obliczenie popytu na przyszłe okna, porównanie dwóch wariantów, dodanie wydarzenia, zatwierdzenie przyszłego planu, jednoczesna aktualizacja widoku miasta i użytkownika, status `pomiar / zgłoszenie / prognoza / nieznane`, reset demo. Dane wejściowe realnie przeliczają wynik; nie są przełącznikiem slajdów.

**Jeśli zostanie czas:** potwierdzenie przyjazdu/odjazdu, powiadomienie o zmianie, prosty wykres trafności prognozy na danych testowych, import rekordu wydarzenia z miejskiego źródła.

**Po konkursie:** integracja z transakcjami parkomatów, czujnikami, systemem płatności i miejskim oznakowaniem. Żadna z tych integracji nie jest warunkiem pokazania rdzenia.

## Zasada decyzji możliwa do obrony

Na potrzeby prototypu silnik porównuje kilka gotowych wariantów przyszłych godzin. Liczy dopasowane i odrzucone prośby trzech grup, długość postoju, brak alternatywy i koszt częstych zmian. Zmienia rekomendację tylko przy wyraźnej przewadze; przy zajętym miejscu lub niepewnych danych zostawia plan i pokazuje powód. Zgłoszenie jednej osoby nie zmienia aktywnej funkcji. Czas trwania okien i wyprzedzenie są parametrami demo, a nie twierdzeniem o przepisach konkretnej ulicy.

## Kierunek wizualny

Inspiracja: **miejska informacja drogowa i plan ulicy**, bez wyglądu typowego generatora SaaS. Ciepła jasna baza, grafitowy tekst, jeden sygnałowy pomarańczowy dla dostaw, głęboki niebieski dla parkingu, zielony dla odbioru. Kolor zawsze wsparty napisem i ikoną. Jedna charakterystyczna „wstęga krawężnika” łączy mapę i oś czasu; proste prostokątne moduły nawiązują do oznaczeń ulicznych. Duża typografia dla `TERAZ` i `OD ...`; reszta spokojna i czytelna. Bez gradientów, szkła, dużych rozmytych cieni, generowanych ilustracji i dziesiątek kart KPI. Delikatna animacja przesunięcia funkcji zatoki tylko wtedy, gdy plan naprawdę się zmienia.

Na telefonie najważniejsze są: decyzja, dojście i aktualne zasady. Na laptopie miasta: oś czasu, konflikt popytu i wyjaśnienie rekomendacji. Puste i niepewne stany mają własny projekt, a nie pustą mapę.

## Dane w pokazie

- [ZDM Warszawa: raport Świętokrzyska 2018](https://zdm.waw.pl/wp-content/uploads/2018/04/Raport_koncowy_Swietokrzyska_dostawy.pdf) — historyczne uzasadnienie konfliktu, **nie** aktualna zajętość zatok.
- [Krakowski BIP: imprezy masowe 2026](https://www.bip.krakow.pl/?dok_id=239845&metka=1) lub [warszawski spis imprez masowych](https://xyz.um.warszawa.pl/B/Bezpieczna/Widget/widget.php) — rzeczywisty rekord wydarzenia tylko wtedy, gdy wiąże się z demonstrowanym obszarem. Inaczej wydarzenie jest jawnie oznaczonym scenariuszem.
- Zgłoszenia wykonane przez zespół/jury — rzeczywiste wejście do prototypu, lecz nie reprezentatywny popyt miasta.
- Wynik porównania wariantów — obliczenie aplikacji na dostępnych danych, **nie** zmierzona redukcja korków lub emisji.

## Kolejność prac w krótkim sprincie

1. Zamrozić jedną ulicę-schemat, trzy zatoki, role i jeden scenariusz demo; przygotować źródła z etykietami.
2. Zaprojektować start, wynik i panel miasta oraz własny język wizualny przed kodowaniem wszystkich ekranów.
3. Zbudować wspólny stan danych: prośba → decyzja → plan → widok użytkownika.
4. Dodać wydarzenie i scenariusz odmowy zmiany, żeby pokazać odporność mechanizmu.
5. Dopracować mobilną czytelność, puste stany, źródło/czas danych, dostępność interfejsu oraz reset scenariusza.
6. Udostępnić link/QR, przetestować na dwóch telefonach i laptopie; przygotować krótkie nagranie awaryjne.

## Warunki gotowości dla jury

- Link otwiera się na telefonie bez instalacji i logowania; samodzielna osoba rozumie główną akcję w ciągu 10 sekund.
- Nowe zgłoszenie zmienia licznik popytu i porównanie wariantów, a zatwierdzony przyszły plan pojawia się w drugim widoku bez ręcznej podmiany obrazka.
- Jedno wydarzenie wpływa na prognozę tylko dla pasującej okolicy i przyszłego czasu.
- Przypadek „zajęte/nieznane” nie pokazuje fałszywego `wolne`.
- Każda miejska informacja ma źródło i datę; dane demonstracyjne są nazwane. Zespół potrafi wytłumaczyć logikę decyzji oraz wskazać, co zbudowano podczas hackathonu.
