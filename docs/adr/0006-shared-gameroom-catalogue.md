# Shared catalogue audiences and browser URLs

Status: accepted (extends ADR 0005 at the owner's request).

The existing Applications records serve tabletop and Gameroom. Their selections
may overlap, but enabling either surface must not enable the other.

Keep Hidden as the tabletop visibility flag: missing or false means enabled.
Add GameroomEnabled, which must be exactly true to enable Gameroom. Tabletop
continues using URL; Gameroom uses only the new WebURL. These fields may point
at different deployments. An enabled surface requires its own HTTPS URL without
credentials; a disabled surface may omit or leave its URL empty. There is no URL
fallback, collection migration, or change to the four-field normalized tabletop
GameTile. Shared Title, Icon and document IDs are unchanged.

The authenticated editor exposes both audience checkboxes and URL fields on
create and edit. All fields save together. Existing records default to tabletop
only. Cribbage is a Gameroom-only example with Hidden true, GameroomEnabled true,
and WebURL https://anicolao.github.io/cribbage/.

Production launcherui also hosts Gameroom rooms. Merge catalogue rule changes
into the deployed combined rules; never replace room permissions with this
repository's standalone rules. Gameroom maintains a deployment guard comparing
the full deployed source against its reviewed baseline.
