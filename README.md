# valda.cloud

Sbírka drobných webových experimentů a her. Žádné frameworky, žádný build krok — každá stránka je jeden samostatný HTML soubor, který si vystačí sám.

🌐 Živě na **[valda.cloud](https://valda.cloud)**

## Co tu je

| | Hra | Popis |
|---|---|---|
| 🎯 | **[Tank Duel 3D](web/games/tank-duel-3d.html)** | Texturovaný tankový souboj v 3D městě na vlastním WebGL enginu. |
| 👾 | **[3D Tank Duel — ZX Spectrum](web/games/3d-tank-duel-zx-spectrum.html)** | Vektorová, drátěná pocta osmibitové klasice ze ZX Spectra. |
| ⚙️ | **[Bobby Bearing](web/games/bobby-bearing.html)** | Izometrický hlavolam — kutálej kuličku po nakloněných plošinách. Pocta The Edge z roku 1986. |

## Jak to běží

Statický web servírovaný `nginx:alpine` za Traefikem v3.6, TLS automaticky z Let's Encrypt. Obsah z adresáře `web/` se jen zkopíruje na server a je okamžitě živý — žádný restart, HTML s `Cache-Control: no-cache`.

```
web/
  index.html        rozcestník
  games/            hry — každá jeden samostatný HTML soubor
```

## Přidání nové věci

1. Hoď nový HTML soubor do `web/` (hru do `web/games/`).
2. Přidej na něj `<a class="card">` v `web/index.html`.
3. Nahraj na server (`scp`, příp. `rsync` celý `web/`).

---

Postaveno staticky, s trochou retro nostalgie.
