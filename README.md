# TuWolno? — prototyp SMART CITY

TuWolno? to responsywna aplikacja Next.js z widokiem kierowcy, panelem miasta i makietą cyfrowego oznakowania. Demo pokazuje prawdziwy odcinek ul. Świętokrzyskiej w Warszawie między ul. Marszałkowską a pl. Powstańców Warszawy. Zatoki A–C, ich położenie, odległości, harmonogramy i początkowe zgłoszenia są **modelowe** — nie opisują istniejących miejsc ani aktualnych zasad ruchu.

## Uruchomienie

Potrzebne są Node.js 20.9 lub nowszy, npm oraz internet do pobrania zależności i wyświetlenia podkładu OpenStreetMap.

```bash
git clone https://github.com/krinczi/HackYeah2026.git
cd HackYeah2026
npm install
npm run dev
```

Otwórz `http://localhost:3000` lub adres wypisany przez `npm run dev`, jeśli port 3000 jest zajęty. Projekt można też pobrać jako ZIP; polecenia `npm` uruchom w folderze zawierającym `package.json`. Jeśli zapora sieciowa pozwala na połączenia lokalne, inne urządzenie w tej samej sieci może otworzyć adres IP komputera na porcie pokazanym przez `npm run dev`.

Świeży klon zaczyna od godziny scenariusza **10:00**, trzech modelowych zatok i czterech przykładowych zgłoszeń. Zegar scenariusza nie przesuwa się sam wraz z rzeczywistym czasem. Po działaniach w aplikacji stan jest zapisywany lokalnie w `data/state.json` i współdzielony przez osoby korzystające z tej samej uruchomionej instancji. Aby zacząć pokaz ponownie, wybierz **Dla miasta → Zamknięcia zatok → Przywróć początek demo**.

`npm test` uruchamia testy logiki, a `npm run build` sprawdza kompilację aplikacji.

## Krótki scenariusz demo

1. W **Szukam miejsca** wybierz **Dostarczam towar**, cel **Sklepy**, przyjazd **11:30**, postój **15 min** i pojazd **Dostawczy**. Wyszukanie zapisze potrzebę, ale początkowo nie wskaże zatoki dopuszczającej tę dostawę.
2. Otwórz **Dla miasta**. Panel porówna warianty przyszłego planu i zaproponuje zatokę A dla dostaw w godzinach **11:00–13:00**. Zobacz **Porównaj warianty i skutki**, a następnie kliknij **Zatwierdź plan**.
3. Wróć do **Szukam miejsca**. Wynik przeliczy się na podstawie zatwierdzonego planu i pokaże zatokę A na liście oraz mapie. To informacja o **dopuszczalnej funkcji**, nie potwierdzenie, że miejsce jest fizycznie wolne.

## Co działa

- Kierowca wybiera dostawę, parking lub odbiór osoby, godzinę, cel i czas postoju. Przy dostawie wybiera też typ pojazdu. Wyniki uwzględniają dozwoloną funkcję przez cały zadeklarowany postój, typ pojazdu i zamknięcie zatoki.
- Mapa OpenStreetMap pokazuje modelowe punkty A–C na rzeczywistym podkładzie ulicy. **Ustaw punkt startowy** dodaje symulowaną pozycję w okolicy po potwierdzeniu w aplikacji; nie pobiera GPS.
- Wyszukanie zapisuje zgłoszoną potrzebę. Ponowne identyczne wyszukanie nie zwiększa licznika. Symulacja wykrywa także potrzeby, dla których obecny plan nie daje pasującej zatoki.
- Przy pasującej zatoce użytkownik może zgłosić przyjazd lub zastane zajęcie, jeśli wybrana godzina jest w odległości do 15 minut od godziny scenariusza. Po zgłoszonym przyjeździe może zgłosić odjazd. Dotyczy to dostaw, parkingu i odbiorów.
- Świeże zgłoszenie zajętości wpływa na wyniki przez 15 minut czasu scenariusza. Po zgłoszeniu przyjazdu zadeklarowany czas postoju pozwala oszacować, kiedy zatoka może się zwolnić. Po deklarowanym końcu lub zgłoszonym odjeździe pojawia się krótkotrwałe **„może być wolne”** z niską pewnością. Samo wyszukanie nie potwierdza zajętości konkretnej zatoki.
- Miasto porównuje plan bez zmian z możliwymi zmianami funkcji na przyszłe okna. Reguła uwzględnia obsłużone i nieobsłużone zgłoszenia, modelową odległość do celu oraz koszt przełączenia. Operator zatwierdza wybrany wariant; historia decyzji i oś czasu pokazują zatwierdzone zmiany.
- Operator może ręcznie dodać wydarzenie z początkiem, końcem i punktem na mapie albo je odwołać. Wydarzenie daje demonstracyjny sygnał możliwych odbiorów blisko godziny zakończenia, ale samo nie wystarcza do rekomendacji zmiany.
- Panel miasta pozwala wyłączyć lub przywrócić zatokę. Makieta oznakowania pokazuje funkcję zatok dla dostępnych godzin podglądu. Otwarte widoki odświeżają wspólny stan demo co około 1,5 sekundy.

## Granice prototypu

- **Nie ma wytrenowanego AI ani bieżących danych z miasta.** Rekomendacja i prognoza wydarzenia są jawnymi regułami demonstracyjnymi. Ewentualny model uczony z danych wymagałby zebrania i oceny rzeczywistych obserwacji.
- Aplikacja nie jest połączona z czujnikami, parkomatami, miejskim API ani rzeczywistymi znakami. Nie rezerwuje miejsc. Zgłoszenia zajętości są deklaracjami użytkownika lub operatora, nie pomiarem fizycznym.
- Modelowe odległości do sklepów, restauracji i przystanku nie są pomiarem tras pieszych. Wskazane punkty A–C wymagają weryfikacji przez zarządcę drogi przed jakimkolwiek użyciem w rzeczywistym ruchu. Makieta znaku nie jest zatwierdzonym oznakowaniem.
- Stan jest przechowywany w lokalnym pliku i wspólny dla wszystkich odwiedzających tę instancję; nie ma kont ani autoryzacji operatora. Wdrożenie wieloinstancyjne wymagałoby współdzielonej bazy, a panel miasta — kontroli dostępu. Proponowany w panelu tygodniowy przegląd planu to założenie produktu, nie obowiązująca zasada miasta.

Źródło opisu problemu: [badanie warszawskiego ZDM z 2018 r.](https://zdm.waw.pl/wp-content/uploads/2018/04/Raport_koncowy_Swietokrzyska_dostawy.pdf). Jest to źródło historyczne, nie dane o bieżącej zajętości.

## Struktura repozytorium

Aplikacja webowa działa w `app/` i `lib/`. Repozytorium zawiera również szkielet Spring Boot w `src/` oraz materiały projektowe w `docs/`. Uruchomienie aplikacji webowej wymaga poleceń `npm` podanych wyżej.