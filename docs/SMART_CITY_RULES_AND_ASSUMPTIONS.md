# SMART CITY — wymagania i założenia

Stan: 3 października 2026. Rejestr wymagań, założeń i decyzji projektowych.

## Źródła

- Załączony brief: [Details - SMART CITY.pdf](<Details - SMART CITY.pdf>) (4 strony).
- Regulamin konkursu SMART CITY: treść w wiadomości użytkowniczki z 3 października 2026.
- Oficjalny opis kategorii: https://hackyeah.pl/tasks-prizes

## Granice zadania

- Rozwiązać konkretny problem miasta lub mieszkańców; wskazać użytkowników, sytuację użycia, korzyść i sposób działania.
- Forma: narzędzie, aplikacja, system lub prototyp. Skala może obejmować ulicę, dzielnicę, usługę lub całe miasto. Brief nie ogranicza lokalizacji do Krakowa.
- Wykazać dokładność i aktualność danych, prostotę użycia oraz możliwość testu w realnych warunkach miejskich.
- Kryteria: pomysł i innowacyjność 30%, związek z kategorią 20%, praktyczność i użyteczność 20%, design 20%, kompletność i wartość wdrożeniowa 10%.
- Zespół 1–6 osób. Przekazany tekst regulaminu zawiera zapis o godzinach 23:00 3 i 4 października. Użytkowniczka skorygowała wcześniejszą interpretację, według której miałby on wstrzymywać research i tworzenie pomysłów. Treść źródłowa zostaje odnotowana, a aktualny plan nie wstrzymuje pracy.
- Zgłoszenie: tytuł, nazwa i skład zespołu, opis oraz prezentacja PDF do 10 slajdów; dodatkowo można podać zrzuty ekranu, repozytorium, demo i grafiki. Język polski lub angielski.
- Można korzystać z istniejących zasobów z podaniem źródeł. Istotne użycie AI, modeli, API, zbiorów danych i bibliotek trzeba ujawnić. Należy wyraźnie oddzielić prace wykonane podczas HackYeah od wcześniejszych elementów; zespół musi umieć objaśnić rozwiązanie.
- Po terminie nie wolno poprawiać zgłoszenia. Próg otrzymania nagrody: co najmniej 50% punktów w pierwszym etapie, według przekazanego regulaminu.

## Ustalenia i kwestie otwarte

1. **Geografia:** Kraków nie jest wymogiem. Wybór miasta/obszaru po 23:00 powinien wynikać z problemu, możliwości pozyskania danych i realnego pilotażu. Późniejsze przeniesienie rozwiązania do innych miast może być zaletą, jeśli nie rozmyje demonstracji.
2. **Dane:** dostępność historyczna, częstotliwość aktualizacji i prawdziwy strumień czasu rzeczywistego to trzy różne rzeczy. Każde twierdzenie o „realtime” wymaga potwierdzonego źródła, opóźnienia i zachowania po utracie danych.
3. **Platforma zgłoszeń:** przekazany regulamin wskazuje HackTribe, a załączony brief Challenge Rocket. Przed wysyłką potwierdzić aktualne instrukcje organizatora/mentorów i aktywny formularz; nie zgadywać.
4. **Dodatkowe zasady:** brief wskazuje, że partnerzy mogą wprowadzić dodatkowe reguły użycia AI i zasobów. Sprawdzić komunikaty konkursowe podczas wydarzenia.
5. **Research i wybór kierunku:** wykonywane teraz zgodnie z najnowszą instrukcją użytkowniczki; wyniki i źródła w `SMART_CITY_RESEARCH.md`.

## Rejestr założeń

| Założenie | Status | Jak sprawdzić |
| --- | --- | --- |
| Konkurs 2026 odbywa się w Krakowie 3–4 października. | Potwierdzone w oficjalnym opisie wydarzenia. | Oficjalna strona HackYeah. |
| Rozwiązanie może dotyczyć dowolnego miasta. | Wynika z braku ograniczenia geograficznego w briefie; jest to interpretacja, nie osobny zapis dosłowny. | Pytanie do mentora, jeśli jury poda dodatkowe kryteria. |
| Sposób interpretacji zapisu o 23:00 dla przygotowawczego researchu. | Według korekty użytkowniczki nie blokuje bieżącej pracy; znaczenie regulaminowe wymagałoby potwierdzenia organizatora. | Harmonogram wydarzenia lub organizator. |
| Wybrany problem będzie miał wystarczająco aktualne, legalnie dostępne dane. | Niezweryfikowane; nie przyjmować jako faktu. | Test źródła danych po starcie zadania. |
| Dane o zajętości P+R są dostępne przez stabilny publiczny API. | Niepotwierdzone: ZTP pokazuje na stronie dane z opóźnieniem około minuty, lecz sposobu integracji nie zweryfikowano. | Dokumentacja ZTP, warunki użycia i test techniczny przed implementacją. |
