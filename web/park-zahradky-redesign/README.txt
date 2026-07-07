Rokytka žije — statický web (Park Zahrádky)
============================================

Nasazení na nginx (jako podsložka existujícího webu):
1) Rozbalte obsah do libovolné podsložky, např. /var/www/vas-web/rokytka/
2) Web poběží na https://vasedomena.cz/rokytka/
   (index.html se načte automaticky).

Soubory:
  index.html      Domů
  kauzy.html      Kauzy a aktuality
  akce.html       Kalendář akcí
  zahradky.html   Zahrádky
  o-spolku.html   O spolku
  kontakt.html    Kontakt

Odkazy mezi stránkami jsou relativní (.html), takže fungují v jakékoli podsložce.
Fonty jsou vloženy přímo v souborech. Fotky se načítají z parkzahradky.cz —
pro plně nezávislý web je stáhněte a nahraďte cesty k obrázkům.

Plně responzivní (mobil → desktop), včetně mobilního menu.
