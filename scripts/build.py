"""Optional standard-library tooling. Production consists exclusively of static files.
Run from anywhere: python scripts/build.py. Never deploy scripts or reference files.
"""
from pathlib import Path
import html,json,re,shutil
from urllib.parse import urlparse
ROOT=Path(__file__).resolve().parents[1]
config_text=(ROOT/'js/config.js').read_text(encoding='utf-8')
cfg=json.loads(config_text.split('export const siteConfig =',1)[1].strip().removesuffix(';'))
origin=cfg['site']['url'].rstrip('/')
assert origin.startswith('https://'), 'site.url must use HTTPS'
for key in ['checkoutUrl','memberAreaUrl']:
 value=cfg['lepas'][key]
 assert not value or (urlparse(value).scheme=='https' and urlparse(value).netloc), f'{key} must be an HTTPS URL or empty'
assert len(cfg['lepas']['phases'])==cfg['lepas']['phaseCount'], 'phaseCount must match phases'
assert sum(len(p['episodes']) for p in cfg['lepas']['phases'])==cfg['lepas']['episodeCount'], 'episodeCount must match titles'
def lookup(key):
 value=cfg
 for part in key.split('.'):value=value[int(part)] if isinstance(value,list) else value[part]
 return value
def money(value):return 'Rp'+f'{value:,}'.replace(',','.')
def sync_match(match):return match[1]+html.escape(str(lookup(match[2])))+match[3]
pages=[p for p in ROOT.rglob('*.html') if not any(v in p.relative_to(ROOT).parts for v in ['dist','scripts'])]
urls=[]
for path in pages:
 text=path.read_text(encoding='utf-8')
 text=re.sub(r'(<span data-config="([^"]+)">)[^<]*(</span>)',sync_match,text)
 price=cfg['lepas']['promoPrice'] if cfg['lepas']['promoActive'] else cfg['lepas']['price']
 text=re.sub(r'(<[^>]+\bdata-price(?:\s[^>]*)?>)[^<]*(</[^>]+>)',lambda m:m[1]+money(price)+m[2],text)
 text=re.sub(r'(<[^>]+\bdata-base-price(?:\s[^>]*)?>)[^<]*(</[^>]+>)',lambda m:m[1]+money(cfg['lepas']['price'])+m[2],text)
 text=re.sub(r'<s data-price-original(?: hidden)?>[^<]*</s>',f'<s data-price-original'+('' if cfg['lepas']['promoActive'] else ' hidden')+'>'+money(cfg['lepas']['price'])+'</s>',text)
 always='data-always-noindex' in text
 text=re.sub(r'<meta name="robots" content="[^"]+">','<meta name="robots" content="'+('index,follow' if cfg['site']['indexable'] and not always else 'noindex,follow')+'">',text)
 # Replace the previous canonical origin coherently in metadata and structured data.
 previous=re.search(r'<link rel="canonical" href="(https://[^/]+)',text)
 if previous:text=text.replace(previous[1],origin)
 for provider in ['instagram','tiktok']:
  value=cfg['brand'][provider]
  text=re.sub(r'(data-social="'+provider+r'" href=")[^"]*(")',lambda m:m[1]+html.escape(value or '/kontak/',quote=True)+m[2],text)
 pending='Pembayaran belum dibuka. Checkout resmi sedang disiapkan.'
 text=re.sub(r'(<p class="small" data-checkout-status>)[^<]*(</p>)',lambda m:m[1]+('Pembayaran dilakukan melalui checkout resmi.' if cfg['lepas']['checkoutUrl'] else pending)+m[2],text)
 path.write_text(text,encoding='utf-8')
 if not always:urls.append(re.search(r'<link rel="canonical" href="([^"]+)"',text)[1])
robots='User-agent: *\nAllow: /\nDisallow: /lepas/thank-you/\nDisallow: /scripts/\nSitemap: '+origin+'/sitemap.xml\n'
# Review uses meta noindex + crawlable pages; robots must not block discovery of noindex.
(ROOT/'robots.txt').write_text(robots,encoding='utf-8')
sitemap='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join('<url><loc>'+html.escape(url)+'</loc></url>\n' for url in sorted(urls))+'</urlset>\n'
(ROOT/'sitemap.xml').write_text(sitemap,encoding='utf-8')
dist=ROOT/'dist';dist.mkdir(exist_ok=True)
# Only copy public assets and authored HTML; no delete, no server runtime, no dependencies.
for path in pages:
 target=dist/path.relative_to(ROOT);target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(path,target)
for directory in ['assets','css','js']:shutil.copytree(ROOT/directory,dist/directory,dirs_exist_ok=True)
for file in ['robots.txt','sitemap.xml','_headers']: 
 if (ROOT/file).exists():shutil.copy2(ROOT/file,dist/file)
print(f'Built {len(pages)} HTML pages into {dist}')
