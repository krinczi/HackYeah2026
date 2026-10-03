# TuWolno? — działający rdzeń demo

Responsywna aplikacja Next.js: widok użytkownika, panel miasta i cyfrowy podgląd zatoki. Scenariusz obejmuje trzy **modelowe** zatoki, a nie zweryfikowane aktualne oznakowanie w Warszawie.

## Uruchomienie

```powershell
npm install
npm run dev
```

Otwórz `http://localhost:3000`. Inne urządzenie w tej samej sieci może otworzyć adres IP komputera na porcie 3000. Stan jest współdzielony przez lokalny proces i zapisany w `data/state.json`; przycisk resetu przywraca scenariusz. `npm test` sprawdza mechanizm decyzji, a `npm run build` kompilację.

## Co działa

- Zgłoszenie dostawy, parkingu lub odbioru; filtr czasu, długości postoju, gabarytu i zamknięcia zatoki.
- Brak obietnicy wolnego miejsca: przy braku pomiaru zajętość to `nieznana`.
- Zapis niezaspokojonego popytu i odrzucanie zduplikowanych zgłoszeń.
- Symulacja wariantu bez zmian i przyszłych zmian funkcji; wynik uwzględnia obsłużone i nieobsłużone zgłoszenia oraz koszt zmiany.
- Wydarzenie demonstracyjne jako sygnał prognozy; samo nie wystarcza do rekomendacji odbioru.
- Akceptacja przyszłego planu i odświeżenie widoków na drugim urządzeniu przez odpytywanie co 1,5 s.
- Zamknięcie zatoki, świeże zgłoszenie zajęcia, przesunięcie czasu scenariusza i reset.

## Granice obecnego rdzenia

- **Brak wytrenowanego AI.** Obecna prognoza jest jawnie demonstracyjną regułą; potrzebny jest zbiór obserwacji postoju do uczenia i oceny modelu.
- Brak połączenia z czujnikami, parkomatami, znakami drogowymi i miejskim API. Nie ma też rezerwacji miejsc.
- Dane utrwala lokalny plik. Do publicznego wdrożenia z wieloma instancjami potrzebna będzie współdzielona baza (planowane Supabase), autoryzacja operatora i osobne sesje jury.
- Przybliżone odległości są częścią scenariusza, nie pomiarem tras pieszych.

Źródło problemu miejskiego: [badanie ZDM Warszawa z 2018 r.](https://zdm.waw.pl/wp-content/uploads/2018/04/Raport_koncowy_Swietokrzyska_dostawy.pdf). Nie jest ono źródłem bieżącej zajętości.
## Folder JetBrains

Ten katalog zawiera działającą aplikację Next.js w `app/` i `lib/` oraz istniejący szkielet Spring Boot w `src/`. Aplikacja webowa działa niezależnie: z terminala w tym katalogu uruchom `npm run dev`. Dokumentacja i brief są w `docs/`.
