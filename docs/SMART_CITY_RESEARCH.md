# SMART CITY — problemy mieszkańców i kierunki projektu

Stan researchu: 3 października 2026. Źródła: urzędowe i dokumentacja standardów. Pomysły poniżej są propozycjami, nie potwierdzonymi produktami ani wynikiem testu z użytkownikami.

## Co faktycznie boli mieszkańców

Badanie telefoniczne Urzędu Miasta Krakowa z 1–14 kwietnia 2025 r. objęło 1805 dorosłych mieszkańców; wyniki ważono według płci, wieku i dzielnicy. Na pytanie o najważniejsze problemy miasta: korki/remonty 47,8%, brak parkingów 22,8%, komunikacja miejska 22,5%, ochrona środowiska/zanieczyszczenie powietrza 16,6%, „betonoza” 13,6%, za mało zieleni 8,5%. To wielokrotne wskazania w jednym badaniu, nie udziały sumujące się do 100% ani dowód gotowości do użycia konkretnej aplikacji. Źródło: https://www.bip.krakow.pl/plik.php?mode=shw&new=t&wer=0&zid=603781

Barometr Krakowski 2024, pytający inaczej o priorytetowe aspekty życia, wskazał koszty życia (32%), rynek pracy (30%), zdrowie (22%) i przemieszczanie się (21%). Nie należy mieszać tych odsetków z poprzednim rankingiem. Źródło: https://www.krakow.pl/zalacznik/493105

W perspektywie przyszłości wzrasta znaczenie upałów i lokalnych podtopień: EEA wymienia je wśród kluczowych zagrożeń miejskich. Miasto samo zachęca do korzystania z „wysp chłodu” i zacienionych tras; ZTP Kraków testuje zielone dachy wiat. Źródła: https://www.eea.europa.eu/en/topics/in-depth/urban-sustainability ; https://krakow.pl/aktualnosci/329244,26,komunikat,wyspy_chlodu_w_krakowie___jak_je_wykorzystac__aby_bezpiecznie_przetrwac_upaly.html ; https://ztp.krakow.pl/wszystkie-aktualnosci/kmk/zielone-dachy-na-wiatach-przystankowych-chlodniej-i-bardziej-ekologicznie.html

To nie jest problem wyłącznie krakowski: w konsultacjach strategii Wrocławia mieszkańcy również wskazywali sprawną komunikację, zieleń i czyste powietrze. Wrocław publikuje rozkład GTFS i pozycje pojazdów w otwartych danych, lecz w tym researchu nie potwierdzono takiego samego zakresu prognoz przyjazdów jak w krakowskim GTFS Realtime. Źródła: https://www.wroclaw.pl/dla-mieszkanca/strategia-wroclaw-2050-konsultacje-z-mieszkancami ; https://open-data.cui.wroclaw.pl/hdb/ft/6/ ; https://open-data.cui.wroclaw.pl/hdb/db/14

## Dane, które można uczciwie wykorzystać

| Źródło | Potwierdzony zakres i świeżość | Ograniczenie |
| --- | --- | --- |
| ZTP Kraków GTFS + GTFS Realtime | Rozkłady, alerty, prognozy kursów i pozycje pojazdów; podczas researchu strona pokazywała aktualizacje plików `.pb` z 3.10.2026. https://gtfs.ztp.krakow.pl/ | Aktualizacja pliku nie gwarantuje dokładności pojedynczej prognozy ani liczby pasażerów. Trzeba czytać timestamp rekordu. |
| IMGW API | Bieżące dane synoptyczne i ostrzeżenia meteo/hydro. https://dane.imgw.pl/apiinfo | Stacja pogodowa nie mierzy mikroklimatu każdego przystanku czy ulicy. |
| GIOŚ API | Pomiary automatyczne od ostatniej pełnej godziny, indeks powietrza. https://powietrze.gios.gov.pl/pjp/content/api | Dane godzinowe, punktowe, mogą mieć przerwy; nie są odczytem dla każdego chodnika. |
| Krakowski MSIP | Część warstw GIS do pobrania bez logowania jako SHP/GeoJSON/DXF; wiele ma WFS. https://msip.krakow.pl/aktualnosci/324198,2053,komunikat,nowa_usluga_pobierania_danych_msip.html | Dostępność konkretnej warstwy cienia, koron drzew czy wiat wymaga osobnej weryfikacji. Dane przestrzenne nie są strumieniem na żywo. |
| ZZM | Inwentaryzacja drzew istnieje; jej część jest aktualizowana cyklicznie. https://www.bip.zzm.krakow.pl/pl/drzewa2/informacje.html | Nie zakładać pełnego, publicznego API ani dokładnego zasięgu koron. Dla małego pilotażu dopuszczalny ręczny audyt geometrii. |

## Trzy koncepcje do rozważenia

### 1. „Cień na przystanku” — rekomendacja

**Problem:** niepewny czas czekania na transport oraz ekspozycja na słońce/upał na przystankach. **Użytkownicy:** pasażer i zarządca infrastruktury. **Działanie:** dla 2–3 sąsiednich przystanków system pokazuje prognozowany przyjazd, bezpieczny moment wyjścia i oszacowany cień na miejscu o konkretnej godzinie; miastu pokazuje, gdzie brak osłony nakłada się na długi czas oczekiwania i jak zmieniłaby to wiata lub drzewo. To połączenie informacji dla pasażera z decyzją inwestycyjną, nie kolejny ogólny planer tras. **Dane:** GTFS Realtime naprawdę aktualizowany, IMGW bieżące warunki, geometria 2–3 przystanków zweryfikowana ręcznie; wynik cienia jest *modelem*, nie pomiarem temperatury. **Pilotaż:** jeden węzeł krakowski, wybrany po sprawdzeniu dostępności kursów i możliwości bezpiecznego audytu. **MVP:** ekran pasażera, demonstracja zmian cienia w ciągu dnia, panel porównujący dwa warianty osłony, widoczna godzina ostatniej aktualizacji i pewność prognozy. **Ryzyko:** brak liczników pasażerów — nie przedstawiać liczby osób korzystających z osłony jako faktu; scenariusze inwestycyjne muszą być oznaczone jako szacunki. Kraków już inwestuje w zielone wiaty, więc wartość projektu leży w wyborze miejsc i codziennej informacji, nie w samym pomyśle zielonej wiaty. Źródła: https://gtfs.ztp.krakow.pl/ ; https://ztp.krakow.pl/wszystkie-aktualnosci/kmk/zielone-dachy-na-wiatach-przystankowych-chlodniej-i-bardziej-ekologicznie.html ; https://budzet.krakow.pl/projekty2024/7202-przystanek-bez-deszczu---rondo-kocmyrzowskie.html

### 2. „Deszczowy punkt” — lokalne podtopienia

**Problem:** podczas ulewy trudno wiedzieć, czy konkretny odcinek ulicy lub przejście jest zalane. **Działanie:** mapa *ryzyka*, z aktualnym ostrzeżeniem IMGW, znanymi miejscami podtopień i krótkotrwałymi potwierdzonymi zgłoszeniami mieszkańców; informacje wygasają automatycznie i zachowują źródło/czas. **Pilotaż:** jeden powtarzalnie zalewany obszar. **Innowacja:** jawna ocena wiarygodności informacji i automatyczne usuwanie starych zgłoszeń. **Ryzyko:** brak potwierdzonego publicznego strumienia podtopień na poziomie ulicy; nie wolno nazywać wyniku gwarantowaną bezpieczną trasą. Źródła: https://dane.imgw.pl/apiinfo ; https://ziw.krakow.pl/aktualnosci/wydzielenie-pionu-utrzymania-odwodnienia-komunalnego-w-ziw-nowa-organizacja-na-rzecz-bezpieczenstwa-przeciwpowodziowego/13796/

### 3. „Pewna przesiadka” — niezawodność zamiast samego ETA

**Problem:** pasażer wie, kiedy przyjedzie pojazd, ale nie wie, czy zdąży na realną przesiadkę przy aktualnych opóźnieniach. **Działanie:** GTFS Realtime wylicza ryzyko utraty połączenia i pokazuje prosty wybór: wyjść teraz, wybrać inny przystanek lub poczekać. Opcjonalny wariant pokazuje emisje podróży jako szacunek. **Pilotaż:** jeden ciąg przesiadkowy w Krakowie. **Plus:** najmocniej odpowiada na wskazany przez mieszkańców problem i ma najlepszy strumień danych. **Ryzyko:** rynek ma już planery i aplikacje opóźnień, więc sama funkcja ETA nie będzie innowacyjna; trzeba wykazać wartość w niezawodności i pomiarze trafności rekomendacji. Źródła: https://gtfs.ztp.krakow.pl/ ; https://krakow.pl/getPdf/?dok_id=288800

## Wybór geograficzny i decyzja

Najlepszy punkt startu: **mały pilotaż w Krakowie, architektura przenośna do innych miast**. Kraków daje potwierdzony aktywny GTFS Realtime, dane krajowe IMGW/GIOŚ i realnego miejskiego odbiorcę. Standard GTFS wspiera późniejszą adaptację, ale warstwy geograficzne i jakość danych trzeba zweryfikować osobno w każdym mieście: https://gtfs.org/ . Nie deklarować od razu działania w całej Polsce.

Przy priorytecie *innowacyjność + eko + realna demonstracja* rekomenduję koncepcję 1. Przy priorytecie *największy zgłaszany ból i pewność danych* koncepcję 3. Koncepcja 2 ma duży potencjał społeczny, lecz najsłabszą dostępność danych ulicznych na żywo.

## Wariant parkingowy: „Parkuj albo jedź”

**Ocena:** silny problem mieszkańców (22,8% wskazań w badaniu z kwietnia 2025), a dzięki danym P+R także wykonalny kierunek. Nie budować kolejnej mapy wolnych miejsc przy ulicy: Kraków testował taki system oparty na czujnikach, a pilotaż zamknięto z powodów technicznych; istnieje też ParkSpace ECO prognozujący możliwość zaparkowania w strefie. Źródła: https://www.bip.krakow.pl/plik.php?mode=shw&new=t&wer=0&zid=603781 ; https://budzet.krakow.pl/projekty2023/6091-rewolucja-parkingowa-naszego-miasta---krakowa-.html ; https://krakow.pl/aktualnosci/269407,30,komunikat,przyszlosc_smart_parkingow.html

**Konkretna decyzja:** przed wjazdem kierowca podaje cel i czas dotarcia. System porównuje trzy warianty: konkretne P+R + aktualna przesiadka, inne P+R oraz dojazd samochodem do celu. Pokazuje całkowity czas, koszt, pozostałą jazdę autem i *prawdopodobieństwo*, że miejsce będzie wolne w chwili przyjazdu; gdy danych brak, status jest „nieznany”. Miastu panel pokazuje, czy można rozłożyć napływ aut między parkingi przed ich zapełnieniem. Innowacja to decyzja i sterowanie popytem *przed* wjazdem, a nie samo wyświetlenie zajętości.

**Twarde dane:** ZTP podaje wolne miejsca na trzech P+R (Górka Narodowa, Pachońskiego, Krowodrza Górka) z deklarowanym opóźnieniem około 1 minuty; GTFS Realtime dostarcza aktualizowane dane kursów. Źródła: https://ztp.krakow.pl/parkingi-pr/sprawdz-wolne-miejsca-pr ; https://gtfs.ztp.krakow.pl/ . Publiczny, stabilny API dla zajętości P+R nie został w tym researchu potwierdzony; przed implementacją trzeba sprawdzić dopuszczalny technicznie i prawnie sposób pobierania.

**MVP:** dwa P+R i jedna relacja do centrum; karta porównująca warianty, aktualny licznik miejsc i prognozę przyjazdu tramwaju/autobusu; symulacja zapełnienia przy wzroście napływu. Prognoza wolnych miejsc wymaga gromadzenia serii czasowej i walidacji; bez niej pokazywać tylko bieżącą zajętość oraz konserwatywny próg ryzyka. Zysk środowiskowy jako szacunek kilometrów jazdy autem unikniętych dzięki przesiadce, nie jako zmierzona redukcja emisji.

**Wniosek porównawczy:** parking może być mocniejszy od „Cienia na przystanku” pod kątem skali zgłaszanego problemu i realnych danych na dziś; „Cień” ma wyraźniejszy charakter przyszłościowej adaptacji klimatycznej. Dla parkingu potrzebne jest szczególnie dobre odróżnienie od istniejących aplikacji.

## Kryteria uczciwej prezentacji

- Każdy ekran z wynikiem pokazuje: źródło, czas pomiaru/aktualizacji, „pomiar”, „prognoza” lub „szacunek” oraz zachowanie po utracie sygnału.
- „Dane nawet gdy ich nie ma” oznacza obliczenie przybliżenia z dostępnych sygnałów, wraz z poziomem niepewności. Nie oznacza wymyślenia pomiarów ani deklarowania dokładności bez walidacji.
- Wynik pilotażu mierzyć konkretnie: trafność prognozy przyjazdu, minuty oczekiwania w słońcu wyliczone na testowych trasach, odsetek poprawnych rekomendacji. Szacunek korzyści inwestycji oddzielić od zmierzonego efektu.
- Przed zgłoszeniem sprawdzić licencje źródeł, aktywny formularz (HackTribe versus Challenge Rocket), zasady AI i limity API.

## Wariant: elastyczne wykorzystanie pasa przy krawężniku

**Założenie:** chodzi o 2–3 istniejące stanowiska postojowe przy sklepach i gastronomii, nie czynny pas ruchu, buspas ani miejsce dla osoby z niepełnosprawnością. Dla czynnego pasa ruchu ocena wykonalności jest znacznie gorsza.

**Surowa ocena:** jako automatyczny system przełączający funkcję po każdym evencie — słaby pomysł do pilotażu hackathonowego. Jako narzędzie dla miasta, które na podstawie obserwacji proponuje *zatwierdzony, przewidywalny harmonogram* użycia 2–3 stanowisk — mocny temat Smart City. Na przykład rano dostawy, później krótkie postoje klientów, wieczorem podjazd i odbiór osób lub zamówień. Harmonogram jest przykładowy, nie rekomendacją dla konkretnej ulicy bez pomiarów.

**Dlaczego nie pełna automatyzacja:** zmienna organizacja ruchu wymaga zatwierdzonego projektu i zasad zmiany; przy ogródku na dotychczasowym miejscu postojowym w Krakowie potrzebna jest dodatkowo procedura zajęcia pasa drogowego i zmiany organizacji ruchu. Znaki muszą dawać jednoznaczną informację, a pojazd zaparkowany wcześniej może blokować zmianę. Źródła: https://www.gov.pl/web/gddkia/zatwierdzenie-projektu-organizacji-ruchu ; https://www.bip.krakow.pl/uslugi/ZDMK-26 ; https://zdmk.krakow.pl/zalatw-sprawe/procedury/zezwolenie-na-ogrodek-gastronomiczny/

**Co jest nowe, a co nie:** wykorzystanie tego samego miejsca do różnych funkcji o różnych porach już istnieje, np. oficjalne dual-use zones w San Francisco i Smart Curbs w Nowym Jorku. Innowacji trzeba szukać w lokalnym silniku decyzji: symulacja wariantów, jawne konflikty użytkowników, mierzalny efekt i proponowanie reguł do zatwierdzenia. Źródła: https://www.sfmta.com/getting-around/drive-park/loading-and-short-term-parking/dual-use-zones ; https://www.nyc.gov/mayors-office/news/2023/09/mayor-adams-dot-commissioner-rodriguez-action-plan-innovative-tools-reimagine

**Dane do MVP:** inwentaryzacja stanowisk i znaków, otwarcia lokali, terminy zapowiedzianych wydarzeń, ręczny pomiar użycia stanowisk oraz konfliktów (podwójne parkowanie, czas postoju), ewentualnie zgłoszenia przedsiębiorców. Sam fakt istnienia restauracji nie dowodzi popytu na miejsce o konkretnej godzinie. Publiczny strumień zajętości stanowisk i dostaw nie został potwierdzony. Wydarzenia powinny wpływać na *wcześniej ogłoszony* plan, nie uruchamiać spontanicznej zmiany w czasie rzeczywistym.

**Test pilotażu:** porównać dwa rozkłady funkcji dla jednego odcinka: liczbę obsłużonych dostaw, minuty podwójnego postoju, rotację, czas szukania miejsca, konflikt z pieszymi i rowerzystami oraz opinie mieszkańców i lokali. Korzyść ekologiczna nie jest automatyczna; jeżeli elastyczne parkowanie zwiększy liczbę wjazdów autem, bilans może być ujemny.

## Porównanie z wcześniejszymi zwycięzcami HackYeah

To wybrane analogie z **różnych kategorii i lat**, a nie zwycięzcy tegorocznego SMART CITY. Opisy zgłoszeń dowodzą zakresu prototypu i ambicji, ale same nie dowodzą późniejszego wdrożenia ani zmierzonego wpływu.

| Projekt i źródło | Co było pokazane/zadeklarowane | Co pozostawało do realnego wdrożenia | Ocena |
| --- | --- | --- | --- |
| **Jak Doczłapię**, Journey Radar 2025, 1. miejsce. https://pwr.edu.pl/uczelnia/aktualnosci/studenci-kn-solvro-najlepsi-w-miedzynarodowym-hackathonie-hackyeah-13906.html | W 24 godziny stworzono narzędzie do zgłoszeń i sprawdzania utrudnień, tras, pobliskich przystanków i położenia; opisano interfejs API do systemów dyspozytorskich. | Źródło nie potwierdza działających integracji z wszystkimi przewoźnikami ani publicznego wdrożenia. | Realny prototyp, szersza skala nieudowodniona; nie nazywać projektu „nierealnym”. |
| **DriveLess Routes**, Less Waste 2022, 1. miejsce. https://2022.hackyeah.pl/winners-2022/ | Propozycja optymalizacji tras śmieciarek z danymi z wag IoT i modułów LTE. | Instalacja i utrzymanie czujników, dostęp do procesu odbioru odpadów oraz walidacja oszczędności paliwa/CO₂. Oficjalny opis jest deklaracją wartości, bez dowodu wdrożenia. | Duże zależności wdrożeniowe; wygrana nie oznacza gotowości do pełnego uruchomienia. |
| **UnionRoutes**, EUfunds GO 2023, 1. miejsce. https://2023.hackyeah.pl/winners-2023/ | Aplikacja tras do obiektów finansowanych z UE; autorzy podali, że działa tylko dla Krakowa, wymienili błędy i niedokończone funkcje. | Kolejne miasta, dopracowanie UX i funkcji. | Dowód, że ograniczenie pilota do jednego miasta i jawne braki nie przekreślały zwycięstwa. |
| **#zostań_w_Świdnicy**, HackSQL Świdnica 2023, 1. miejsce. https://2023.hackyeah.pl/winners-2023/ ; https://pfr.pl/programuj-miasta | Wizja platformy dopasowującej szkolenia do ofert pracy; sami autorzy zaznaczyli, że nie zdążyli wykonać całości i zaczęli od zbierania danych z ogłoszeń. | Pełny model potrzeb rynku, dane przedsiębiorców i mieszkańców, współpraca szkół i miasta, efekty na emigrację młodych. | Nagrodzono ambitny kierunek z wąskim pierwszym krokiem; nie ma tu dowodu na pełne wdrożenie. |

**Wniosek dla elastycznego krawężnika:** Zwycięskie prace mogły mieć odległą wizję i ograniczony prototyp. To nie zwalnia z wykazania działającego rdzenia. Nasz rdzeń: jeden odcinek, zebrane obserwacje, dwie alternatywne reguły godzinowe, symulator konfliktów i panel zatwierdzenia przez urzędnika. Automatyczne przełączanie funkcji po każdym evencie bez zatwierdzonej organizacji ruchu byłoby słabsze pod względem praktyczności niż analogie powyżej. Wcześniejsze lata/kategorie nie dają podstaw do przewidywania decyzji jury SMART CITY 2026.

## Alternatywa: „Chłodny Dyżur” — elastyczne użycie miejskich budynków

**Problem:** fala upałów; nawet gdy w dzielnicy istnieją klimatyzowane biblioteki lub inne miejskie wnętrza, ich godziny i dostępność mogą nie pokrywać się z czasem największej potrzeby. Kraków oficjalnie wskazuje miejskie wyspy ciepła i potrzebę korzystania z wysp chłodu: https://krakow.pl/aktualnosci/329244,26,komunikat,wyspy_chlodu_w_krakowie___jak_je_wykorzystac__aby_bezpiecznie_przetrwac_upaly.html . Międzynarodowy precedens: Los Angeles używa bibliotek jako miejsc ochłody podczas regularnych godzin i uruchamia dodatkowe centra na czas długotrwałych upałów: https://emergency.lacity.gov/heat . To dowodzi sensu operacyjnego, ale też że sama mapa takich miejsc nie jest innowacją.

**Mechanizm:** panel dla miasta proponuje, które już istniejące pomieszczenie otworzyć jako punkt ochłody i na ile godzin, na podstawie ostrzeżenia IMGW, godzin placówek, zweryfikowanej dostępności, dojścia pieszo i ręcznie potwierdzonej pojemności. Mieszkaniec widzi tylko *zatwierdzone i potwierdzone* lokalizacje, aktualny status oraz godzinę weryfikacji. Niedostępność lub brak aktualizacji wyłącza lokalizację z rekomendacji. Dane IMGW: https://dane.imgw.pl/apiinfo . Innowacja leży w planowaniu dyżurów i wykrywaniu luk zasięgu, nie w statycznej mapie chłodnych miejsc.

**MVP:** jedna dzielnica, 3–5 hipotetycznych/kandydackich miejskich obiektów z jawnie oznaczonym statusem zgody, scenariusz historycznej fali upałów, symulacja zasięgu 10–15 minut pieszo przed i po przesunięciu godzin jednej placówki, panel operatora zatwierdzający dyżur. Potwierdzenie od placówki jest warunkiem pokazania jej mieszkańcom jako otwartej. Nie nazywać temperatury z miejskiej stacji IMGW pomiarem wewnątrz każdej sali.

**Surowa ocena:** mocny związek z adaptacją klimatyczną i wykorzystaniem istniejących zasobów; słabszy od parkingu jako temat najczęściej zgłaszanego problemu. Sezonowość (hackathon w październiku), koszty obsady/energii, dostępność budynków i brak publicznego strumienia ich pojemności obniżają wiarygodność wdrożenia. Efekt eko to przede wszystkim adaptacja i wykorzystanie istniejącej infrastruktury; redukcji CO₂ nie wolno zakładać. Wybierać tylko jeśli można dobrze pokazać symulację luki dostępu i uczciwy workflow potwierdzania dyżuru.

**Decyzja użytkowniczki:** „Chłodny Dyżur” odrzucony jako słaby pomysł; nie rozwijać go dalej bez nowej prośby.

## Alternatywa do oceny: elastyczna logistyka odpadów po wydarzeniach

Kraków prowadzi projekt minimalizacji odpadów podczas dużych wydarzeń i ma program dobrych praktyk dla imprez. Źródła: https://www.krakow.pl/aktualnosci/271689,2163,komunikat,krakow_ogranicza_powstawanie_odpadow_podczas_duzych_wydarzen.html ; https://zis.krakow.pl/tauron-23-cracovia-maraton-w-dobrym-klimacie?category=69&hl=pl . Pomysł: dla jednego powtarzalnego wydarzenia panel proponuje rozstawienie *przenośnych* punktów segregacji/zwrotu opakowań w zatwierdzonym terenie imprezy, z innym planem przed, podczas i po wydarzeniu. Dane: plan imprezy i przewidywana frekwencja od organizatora; meldunki obsługi o zapełnieniu/zaśmieceniu z oznaczeniem czasu, bez fikcyjnego czujnika. MVP: symulacja 2 wariantów rozstawienia, ręczne zgłoszenie zapełnienia, dyspozycja przeniesienia/opróżnienia, rozliczenie masy odpadów i błędów segregacji, jeśli organizator udostępni pomiary. Nie deklarować redukcji odpadów bez pomiarów.

**Ocena surowa:** wykonalne jako pilot z organizatorem, ekologicznie bezpośrednie, bez zmiany organizacji ruchu, jeśli działa na terenie imprezy. Samo inteligentne opróżnianie koszy jest wtórne wobec nagrodzonych już projektów IoT z 2022 r.; nowość musiałaby wynikać z czasowej zmiany lokalizacji i funkcji stanowisk oraz pomiaru jakości segregacji/zwrotów. Bez partnera i dostępu do jednego wydarzenia zostaje tylko symulacja. Słabsze od elastycznego krawężnika jako odpowiedź na powszechny problem mieszkańców; nie rekomendować jako automatyczny zamiennik oryginalnego pomysłu.

## Nowy kandydat: AfterFlow — rozpraszanie potoku po wydarzeniu

**Problem i użytkownik:** po koncercie/meczu wiele osób jednocześnie wybiera najbliższy przystanek, choć inne osiągalne przystanki i kursy mogą dawać lepszą podróż. Użytkownik to uczestnik wydarzenia, opcjonalnie organizator/ZTP do analizy. Pilotaż: wyjście z jednego obiektu, np. TAURON Arena, dwie zweryfikowane pieszo drogi do przystanków TAURON Arena Kraków al. Pokoju oraz Wieczysta. Obiekt potwierdza istnienie obu punktów dojścia: https://www.tauronarenakrakow.pl/en/how-to-get-there/ . ZTP/miasto historycznie wzmacniały kursy po wydarzeniach: https://www.krakow.pl/aktualnosci/225596,1912,komunikat,dodatkowe_autobusy_po_koncercie_paula_mccartneya.html .

**Dane potwierdzone:** ZTP publikuje GTFS i aktualizowane GTFS Realtime: TripUpdates, VehiclePositions, ServiceAlerts https://gtfs.ztp.krakow.pl/ . Miasto publikuje listę imprez masowych z datą, godzinami, miejscem i **maksymalną liczbą uczestników z decyzji**, a nie faktyczną frekwencją: https://bip.krakow.pl/?dok_id=239845 . Planowanie drogi pieszej wymaga audytu dojść oraz aktualizacji o roboty drogowe; nie zakładać bezpiecznej alternatywy z samej mapy.

**Mechanizm:** aplikacja pokazuje 2–3 alternatywne przystanki i całą podróż do celu: dojście + realne/planowe przyjazdy + zakłócenia + koszt opóźnienia. Jedno-dwa dotknięcia pozwalają zgłosić faktyczny czas czekania/kolejkę, z czasem wygaśnięcia i oceną wiarygodności. Jeśli brak pomiaru tłoku, status jest „nieznany”; maksymalna frekwencja wydarzenia to tylko skala scenariusza. Algorytm rozdziela rekomendacje, aby nie kierować wszystkich do tego samego przystanku, lecz nie obiecuje zmierzonej pojemności tramwajów.

**MVP/demo:** jedno wydarzenie, jedno wyjście, dwa przystanki, jeden kierunek podróży; ekran „najbliższy przystanek: 17 minut łącznie / alternatywny: 14 minut łącznie”, przeliczenie po zmianie realnego ETA i po świeżym zgłoszeniu tłoku. Liczby są dopiero przykładem interfejsu; demo ma użyć aktualnych GTFS-RT lub jawnie oznaczonego replayu archiwalnych danych. Korzyść ekologiczna: potencjalny wzrost atrakcyjności transportu zbiorowego; emisji nie przypisywać bez pomiaru zmiany środka podróży.

**Porównanie z CURBSHIFT:** AfterFlow ma lepszy publiczny strumień czasu rzeczywistego i może dać działający produkt bez zmiany organizacji ruchu. Ryzyko innowacyjności: planery i „Jak Doczłapię” już istnieją; wyróżnikiem musi być **koordynacja zbiorowego odpływu po wydarzeniu** i jawna niepewność informacji o tłoku, nie samo ETA. Jest mocniejszy konkursowo, jeśli da się pokazać prawdziwy scenariusz z dwoma sensownymi przystankami oraz live/replay GTFS-RT. CURBSHIFT ma bardziej oryginalną decyzję miejską, ale słabszy dostęp do danych i trudniejszą drogę wdrożenia.

**Korekta po reakcji użytkowniczki:** AfterFlow nie spełnił oczekiwań jako wystarczająco sensowny/odrębny pomysł; nie rozwijać go jako rekomendacji bez nowej prośby.

## Kandydat do oceny: RainReady — dyspozycja czyszczenia wpustów przed ulewą

**Potwierdzony problem:** ZIW Kraków odpowiada za ponad 27 tys. wpustów, czyści je i apeluje o zgłaszanie niedrożnych przed intensywnym deszczem. Ma całodobowy kanał interwencji, więc istnieje realny odbiorca i działanie. https://krakow.pl/aktualnosci/329532,29,komunikat,zarzad_infrastruktury_wodnej_apeluje_o_zglaszanie_niedroznych_studzienek.html ; https://ziw.krakow.pl/bezpieczny-krakow/numery-alarmowe/ . IMGW publikuje API aktualnych ostrzeżeń i danych pomiarowych: https://dane.imgw.pl/apiinfo . Kraków ma plan ograniczania podtopień lokalnych: https://www.bip.krakow.pl/?metka=1&sub_dok_id=187480 .

**Decyzja produktu:** przy zapowiedzianej ulewie i ograniczonym czasie ekipy, które 5–10 wpustów na jednej ulicy/obszarze należy sprawdzić lub oczyścić najpierw? Wejście: ręczna inwentaryzacja wpustów, zgłoszenia z lokalizacją/zdjęciem i czasem, powtarzalność wcześniejszych zatorów (jeśli zebrana), bieżące ostrzeżenie IMGW, punkty wrażliwe. Wyjście: krótka lista z powodami priorytetu i trasa dla operatora; po wizycie status „potwierdzony drożny / wymaga działania”. Nie prognozować poziomu wody ani nie obiecywać, że czyszczenie zapobiegnie podtopieniu.

**MVP:** pilot 5–10 widocznych z ulicy wpustów, bez dotykania infrastruktury; własny audyt fotograficzny bez osób/tablic, aktualny alert IMGW lub jawnie oznaczony replay historycznego ostrzeżenia, 2–3 zgłoszenia oznaczone jako rzeczywiste albo symulowane; dashboard kolejności inspekcji i potwierdzenia. Publiczna mapa wszystkich wpustów i dostęp do historii prac ZIW nie zostały potwierdzone. Wersja produkcyjna wymaga współpracy ZIW lub samodzielnej inwentaryzacji małego obszaru.

**Innowacja i granice:** samo zgłaszanie zatkanych wpustów już istnieje w Krakowie, a San Francisco ma Adopt a Drain https://adoptadrain.sfwater.org/about ; NYC stosuje priorytetyzację inspekcji na podstawie danych https://comptroller.nyc.gov/wp-content/uploads/documents/Is-New-York-City-Ready-for-Rain.pdf . Wyróżnik musiałby polegać na *krótkookresowym doborze prac przed prognozowanym deszczem* i jawnej pewności zgłoszeń w małym obszarze. To realna adaptacja klimatyczna; korzyści CO₂ nie zakładać. Silny problem i odbiorca, lecz utrzymaniowe wdrożenie zależy od partnerstwa z ZIW.

## Decyzja portfelowa wg kryteriów SMART CITY

Wagi: innowacja 30%, kategoria 20%, praktyczność 20%, design 20%, kompletność/wdrożenie 10%. Ranking jest *subiektywną oceną potencjału dobrze wykonanego prototypu*, nie prognozą głosów jury. Najlepszy kierunek przy priorytecie „oryginalność + pamiętny pokaz + realny problem” to **CURBSHIFT** pod warunkiem znalezienia konkretnej ulicy z powtarzalnym konfliktem dostawy–postój i zdobycia choć małej próbki obserwacji. Bez tego spada szczególnie praktyczność i kompletność. Najbezpieczniejszy technicznie jest **Parkuj albo jedź** (3 P+R z bieżącą liczbą miejsc) lub **Pewna przesiadka** (GTFS-RT), ale oba mają słabszą innowacyjność wobec istniejących planerów. „Cień na przystanku” może być mocną alternatywą eko, lecz wymaga wiarygodnej geometrii cienia i jest sezonowy. RainReady ma dobry problem operacyjny, lecz zgłoszenia wpustów i priorytetyzacja istnieją już gdzie indziej. AfterFlow, Deszczowy punkt, szkolna ulica, EventClean i Chłodny Dyżur słabsze w tym konkretnym konkursie ze względu na wtórność, brak wiarygodnych danych lub ograniczoną demonstrację.

**Brama go/no-go dla CURBSHIFT:** (1) jedna ulica z niebudzącymi wątpliwości 2–3 miejscami i dostawami; (2) zarejestrowane co najmniej kilka rzeczywistych przypadków konfliktu w różnych porach, bez udawania reprezentatywnej statystyki; (3) działający wybór dwóch harmonogramów ze źródłem i niepewnością; (4) pokaz legalnej ścieżki zatwierdzenia. Jeśli 1–2 nie udają się, przejść na P+R, zamiast opierać demo wyłącznie na sztucznych danych.

## Zrewidowana decyzja konkursowa 3.10.2026

Po uwadze użytkowniczki skorygowano poprzednią ocenę „Cienia na przystanku”. Przeceniła innowacyjność i siłę 30-sekundowego przekazu tej koncepcji. **Wybór: CURBSHIFT w wąskiej wersji** — 1–3 zweryfikowane zatoki, dwa zastosowania (krótkie dostawy i postój), zgłoszenia planowanego przyjazdu od obu grup, demonstracja przełączenia funkcji według wcześniej zatwierdzonych zasad i jednolity widok znaku oraz aplikacji. To pełniejsze wykorzystanie wagi innowacji 30% i designu 20% w briefie. Nie budować aplikacji parkingowej dla całego miasta ani twierdzić, że przełączanie bez zatwierdzenia jest legalne.

Subiektywna ocena potencjału dobrze wykonanego prototypu w skali 0–10; kolumny odpowiadają wagom briefu 30/20/20/20/10:

| Pomysł | Innowacja | Kategoria | Użyteczność | Design | Wdrożenie | Suma ważona |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| CURBSHIFT: dwustronny popyt, elastyczna zatoka | 8 | 9 | 5 | 9 | 5 | 7,5 |
| Parkuj albo jedź | 5 | 9 | 8 | 8 | 8 | 7,3 |
| AfterFlow | 5 | 9 | 7 | 8 | 7 | 7,0 |
| Cień na przystanku | 5 | 9 | 7 | 7 | 7 | 6,8 |
| CURBSHIFT: sama mapa wolnych miejsc | 5 | 9 | 4 | 8 | 3 | 6,0 |

To nie jest światowa nowość: elastyczne wykorzystanie pasa przy krawężniku istnieje za granicą. Wyróżnik konkursowy to zderzenie dwóch zgłoszonych potrzeb, pokazanie skutku dla ulicy i aktualizacja z jasnym źródłem oraz niepewnością. Warszawski raport ZDM dowodzi historycznego problemu, ale nie aktualnej zajętości ani efektu interwencji. Główne ryzyko: bez choć jednego aktualnie zweryfikowanego miejsca i minimum pomiaru popytu praktyczność i kompletność spadną, a wybrany pomysł przestanie wygrywać z P+R.

**Doprecyzowanie po uwadze użytkowniczki:** Brief przyznaje tylko 10% za kompletność/wartość wdrożeniową, a łącznie 50% za innowację i design. Konkursowa wizja CURBSHIFT może pokazać trzy funkcje tej samej przestrzeni (dostawy, zwykły postój, odbiór po wydarzeniu) i reagowanie na zgłoszenia oraz wydarzenia. Nie trzeba mieć fizycznego wdrożenia miejskiego podczas hackathonu. Potrzebny jest działający rdzeń demo, który zmienia rekomendację na podstawie wejść, wizualizacja znaku/aplikacji i jasne oznaczenie, co jest pomiarem, zgłoszeniem lub symulacją. Ścieżka zatwierdzenia przez miasto jest elementem przyszłego pilotażu, nie bramą do prezentacji. Nie obiecywać redukcji emisji bez pomiaru.
