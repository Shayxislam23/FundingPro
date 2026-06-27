# Clay-lite UI — local verification

After syncing mobile code to the ASCII dev path, verify Clay-lite in the iOS simulator.

## Sync (if you edit under the Cyrillic monorepo path)

```bash
rsync -av --delete \
  --exclude node_modules --exclude .expo \
  "/Users/shayxislamseytibaev/Documents/Shayxislam Seytibaev Docs/beta/fundingpro/код/FundingPro/mobile/" \
  ~/Projects/FundingPro/mobile/
```

`npm run mobile:dev` prefers `~/Projects/FundingPro/mobile` when it exists.

## Start Metro

From **monorepo root**:

```bash
npm run mobile:dev
```

In the dev client on the simulator: **Reload** (⌘R).

If native modules (gradient, haptics, sharing) fail after a pull:

```bash
npm run mobile:rebuild-ios
```

## Visual checklist

| Area | Expected |
|------|----------|
| Canvas | Background `#E8F0EA` |
| Cards / pills | Clay raised/inset surfaces (`ClaySurface`) |
| Tab bar | Floating dock, not flat system tabs |
| Hero (landing) | Gradient **without** clay overlay on the hero block |
| Haptics | Light feedback on primary buttons (device) |
| Share | Grant detail share sheet works |

## Automated checks (CI / pre-push)

```bash
npm run mobile:typecheck
npm run lint --workspace=mobile
```

Both must pass before EAS preview builds.
