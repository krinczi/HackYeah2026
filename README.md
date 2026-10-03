# TuWolno? — działający rdzeń demo

Responsywna aplikacja Next.js: widok użytkownika, panel miasta i cyfrowy podgląd zatoki. Pokaz osadzono na prawdziwym odcinku ul. Świętokrzyskiej między Marszałkowską a pl. Powstańców Warszawy, ale punkty A–C, ich harmonogramy i zgłoszenia są **modelowe**, a nie aktualnym oznakowaniem Warszawy.

Pierwszy ekran prowadzi przez trzy proste kroki: wybór celu postoju → godzina i miejsce → wynik. Panel miasta jest osobnym widokiem; porównania i scenariusze są rozwijane dopiero na żądanie.

## Uruchomienie

```powershell
npm install
npm run dev
```

Otwórz `http://localhost:3000`. Inne urządzenie w tej samej sieci może otworzyć adres IP komputera na porcie 3000. Stan jest współdzielony przez lokalny proces i zapisany w `data/state.json`; przycisk resetu przywraca scenariusz. `npm test` sprawdza mechanizm decyzji, a `npm run build` kompilację.

## Co działa

- Zgłoszenie dostawy, parkingu lub odbioru; filtr czasu, długości postoju, gabarytu i zamknięcia zatoki.
- Mapa OpenStreetMap obok listy wyników pokazuje trzy punkty scenariusza na rzeczywistej ulicy. Przycisk punktu startowego pyta o zgodę w aplikacji i ustawia **symulowaną pozycję na tym odcinku**; nie pobiera GPS.
- Pasek pokazu przełącza trzy odtwarzalne sytuacje: koniec postoju i zgłoszenie zajęcia, konflikt dwóch dostaw z parkingiem oraz odbiory po wydarzeniu. Sceny zapisują demonstracyjne dane w tym samym lokalnym stanie, więc panel miasta, kierowca i makieta znaku reagują na siebie.
- Brak obietnicy wolnego miejsca: przy braku pomiaru zajętość to `nieznana`.
- Po potwierdzonym przyjeździe aplikacja zapisuje deklarowany czas postoju. Do jego końca zatoka jest traktowana jako prawdopodobnie zajęta, a przez kolejne 15 minut może pojawić się sygnał `może być wolne` z niską pewnością. Świeższe zgłoszenie zajęcia go zastępuje; samo wyszukanie nie wystarcza do oszacowania konkretnej zatoki.
- Zapis niezaspokojonego popytu i odrzucanie zduplikowanych zgłoszeń.
- Symulacja wariantu bez zmian i przyszłych zmian funkcji; wynik uwzględnia obsłużone i nieobsłużone zgłoszenia oraz koszt zmiany.
- Wydarzenie demonstracyjne jako sygnał prognozy; samo nie wystarcza do rekomendacji odbioru.
- Akceptacja przyszłego planu i odświeżenie widoków na drugim urządzeniu przez odpytywanie co 1,5 s.
- Zamknięcie zatoki, świeże zgłoszenie zajęcia, przesunięcie czasu scenariusza i reset.
- Użytkownik może zgłosić przyjazd, zastane zajęcie i odjazd blisko godziny przyjazdu. Zgłoszenia mają źródło i godzinę scenariusza, wygasają po 15 minutach; odjazd nie oznacza potwierdzonego wolnego miejsca.
- Panel miasta zapisuje historię zatwierdzonych przyszłych okien, pokazuje pochodzenie sygnału wydarzenia i proponowany rytm przeglądu harmonogramu.
- Sceny można uruchamiać wielokrotnie z dowolnego widoku, aby jury mogło porównać przypadki bez ręcznego resetu.

## Granice obecnego rdzenia

- **Brak wytrenowanego AI.** Obecna prognoza jest jawnie demonstracyjną regułą; potrzebny jest zbiór obserwacji postoju do uczenia i oceny modelu.
- Brak połączenia z czujnikami, parkomatami, znakami drogowymi i miejskim API. Nie ma też rezerwacji miejsc.
- Zgłoszenia zajętości w demo są deklaracjami użytkownika lub operatora, nie pomiarami fizycznymi. Rytm tygodniowego przeglądu w pilotażu jest propozycją produktu, nie automatyczną zmianą prawa ani faktem o Warszawie.
- Dane utrwala lokalny plik. Do publicznego wdrożenia z wieloma instancjami potrzebna będzie współdzielona baza (planowane Supabase), autoryzacja operatora i osobne sesje jury.
- Przybliżone odległości są częścią scenariusza, nie pomiarem tras pieszych.
- Punkty A–C są orientacyjną wizualizacją modelu na ul. Świętokrzyskiej. Nie wskazują zweryfikowanych zatok ani aktualnego oznakowania; do rzeczywistego wdrożenia potrzebne są współrzędne i zasady potwierdzone przez zarządcę drogi. Podkład mapowy wymaga internetu.

Źródło problemu miejskiego: [badanie ZDM Warszawa z 2018 r.](https://zdm.waw.pl/wp-content/uploads/2018/04/Raport_koncowy_Swietokrzyska_dostawy.pdf). Nie jest ono źródłem bieżącej zajętości.
## Folder JetBrains

Ten katalog zawiera działającą aplikację Next.js w `app/` i `lib/` oraz istniejący szkielet Spring Boot w `src/`. Aplikacja webowa działa niezależnie: z terminala w tym katalogu uruchom `npm run dev`. Dokumentacja i brief są w `docs/`.
