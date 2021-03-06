const fs = require('fs')
const builder = require('xmlbuilder')
const path = require('path')

const { languages: langs } = require('../constants')

// @return string
const perPage = (
  SITE_ROOT, // @param: string
  page, // @param: any[]
  sitemapXML, // @param: any
  lang // @param: string
) => {
  const pathPage = page.tags ? page.tags[0] : null
  const exclude = page.data.seo_exclude_from_sitemap === 'Yes'
  if (!exclude && pathPage && pathPage.length > 0 && pathPage !== '404') {
    const page = `${SITE_ROOT}/${lang}${pathPage}`
    const modDate = new Date()
    const url = sitemapXML.ele('url')
    url.ele('loc', page)
    url.ele(
      'lastmod',
      `${modDate.getFullYear()}-${`0${modDate.getMonth() + 1}`.slice(
        -2
      )}-${`0${modDate.getDate()}`.slice(-2)}`
    )
    url.ele('changefreq', 'monthly')
    url.ele('priority', '0.5')
  }

  return sitemapXML
}

// Exports API
module.exports = prismicApi => {
  try {
    const SITE_ROOT = process.env.SITE_ROOT
    const DESTINATION = path.join(__dirname, '..', 'static', 'sitemap.xml')

    let sitemapXML = builder
      .create('urlset', { encoding: 'utf-8' })
      .att('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9')

    const lang = prismicApi.LANGS_PRISMIC[langs[0]]
    const promises = []
    prismicApi.COMMON_REPEATABLE_DOCUMENTS.forEach(docType => {
      promises.push(
        new Promise((success, failure) => {
          prismicApi.getAllForType(null, docType, lang, success, failure, 1)
        })
      )
    })

    Promise.all(promises)
      .then(values => {
        values.map(group => {
          group.map(item => {
            sitemapXML = perPage(SITE_ROOT, item, sitemapXML, langs[0])
          })
          const sitemapString = sitemapXML.end({ pretty: true })
          fs.writeFile(DESTINATION, sitemapString, (err, data) => {
            if (err) {
              console.log('Error updating sitemap', err)
            }
            console.log(`Sitemap updated`)
          })
        })
      })
      .catch(e => {
        console.log('Error writing sitemap', e)
      })
  } catch (e) {
    console.log('Error writing sitemap', e)
  }
}
