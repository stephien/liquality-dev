const TestUtil = require('../utils/TestUtils')
const OverviewPage = require('../Pages/OverviewPage')
const HomePage = require('../Pages/HomePage')
const PasswordPage = require('../Pages/PasswordPage')
const puppeteer = require('puppeteer')
const { expect } = require('chai')

const testUtil = new TestUtil()
const overviewPage = new OverviewPage()
const homePage = new HomePage()
const passwordPage = new PasswordPage()

let browser, page, dappPage
const password = '123123123'

describe('Dapp Injection-[mainnet,dappTest,smoke]', async () => {
  beforeEach(async () => {
    browser = await puppeteer.launch(testUtil.getChromeOptions())
    page = await browser.newPage()
    await page.goto(testUtil.extensionRootUrl, { waitUntil: 'load', timeout: 60000 })
    await homePage.ScrollToEndOfTerms(page)
    await homePage.ClickOnAcceptPrivacy(page)

    // Import wallet option
    await homePage.ClickOnImportWallet(page)
    // Enter seed words and submit
    await homePage.EnterSeedWords(page)
    // Create a password & submit
    await passwordPage.SubmitPasswordDetails(page, password)
    // overview page
    await overviewPage.HasOverviewPageLoaded(page)
    await overviewPage.CloseWatsNewModal(page)
    if (process.env.NODE_ENV === 'mainnet') {
      await overviewPage.SelectNetwork(page, 'mainnet')
    } else {
      await overviewPage.SelectNetwork(page)
    }
    // Click on Backup seed from Burger Icon menu
    await overviewPage.ClickOnBurgerIcon(page)
    // Click on Settings
    await overviewPage.SelectSettings(page)
    // toggle web3 wallet option
    await page.click('#default_web3_wallet_toggle_button > label > div')
    await page.waitForTimeout(1000)
  })
  afterEach(async () => {
    if (page != null && dappPage != null) {
      await page.close()
      await dappPage.close()
      await browser.close()
    }
  })

  it('Sushi injection - ETH', async () => {
    // Go to Sushi app
    dappPage = await browser.newPage()
    await dappPage.setViewport({
      width: 1366,
      height: 768
    })
    await dappPage.goto('https://app.sushi.com/swap', { timeout: 60000 })
    try {
      await dappPage.waitForSelector('#connect-wallet', { visible: true, timeout: 60000 })
      await dappPage.click('#connect-wallet')
    } catch (e) {
      await testUtil.takeScreenshot(dappPage, 'sushi-dapp-load-issue')
      const pageTitle = await dappPage.title()
      const pageUrl = await dappPage.url()
      expect(e, `Sushi dapp UI not loading.....${pageTitle}...${pageUrl}`).equals(null)
    }
    // Before click on injected wallet option.
    const newPagePromise = new Promise(x => browser.once('targetcreated', target => x(target.page()))) /* eslint-disable-line */
    // Click on Injected Option
    const injectedOption = await dappPage.$x("//*[text()='Injected']")
    injectedOption[0].click()
    // select ETH from connected
    const connectRequestWindow = await newPagePromise
    try {
      await connectRequestWindow.waitForSelector('#ETHEREUM', { visible: true, timeout: 60000 })
    } catch (e) {
      await testUtil.takeScreenshot(connectRequestWindow, 'sushi-ethereum-loading-issue')
      expect(e, 'sushi ethereum loading issue').equals(null)
    }
    await connectRequestWindow.click('#ETHEREUM')
    // Check connect button is enabled
    await connectRequestWindow.click('#connect_request_button').catch(e => e)
    // Check web3 status as connected
    await dappPage.waitForSelector('#web3-status-connected', { visible: true })
  })
  it('Sushi injection - Polygon', async () => {
    // Select polygon network
    await page.click('#dropdown-item')
    await page.waitForSelector('#polygon_web_network', { visible: true })
    await page.click('#polygon_web_network')

    // Go to Sushi app
    dappPage = await browser.newPage()
    await dappPage.setViewport({
      width: 1366,
      height: 768
    })
    await dappPage.goto('https://app.sushi.com/swap', { timeout: 60000 })
    try {
      await dappPage.waitForSelector('#connect-wallet', { visible: true, timeout: 60000 })
      await dappPage.click('#connect-wallet')
    } catch (e) {
      await dappPage.screenshot({ path: 'screenshots/sushi-dapp-load-issue.png', fullscreen: true })
      const pageTitle = await dappPage.title()
      const pageUrl = await dappPage.url()
      expect(e, `Sushi dapp UI not loading.....${pageTitle}...${pageUrl}`).equals(null)
    }
    // Before click on injected wallet option.
    const newPagePromise = new Promise(x => browser.once('targetcreated', target => x(target.page()))) /* eslint-disable-line */
    // Click on Injected Option
    const injectedOption = await dappPage.$x("//*[text()='Injected']")
    injectedOption[0].click()
    const connectRequestWindow = await newPagePromise
    await connectRequestWindow.waitForSelector('#POLYGON', { visible: true })
    await connectRequestWindow.click('#POLYGON')
    // Check connect button is enabled
    await connectRequestWindow.click('#connect_request_button').catch(e => e)
    // Check web3 status as connected
    await dappPage.waitForSelector('#web3-status-connected', { visible: true })
  })
  it.skip('1Inch injection - ETH', async () => {
    // Go to 1inch app
    const dappPage = await browser.newPage()
    await dappPage.goto('https://app.1inch.io/', { timeout: 60000 })
    try {
      await dappPage.waitForSelector('[data-id$="header.connect-wallet-button"]', { visible: true, timeout: 60000 })
      await dappPage.click('[data-id$="header.connect-wallet-button"]')
    } catch (e) {
      await dappPage.screenshot({ path: 'screenshots/1inch-dapp-load-issue.png', fullscreen: true })
      const pageTitle = await dappPage.title()
      const pageUrl = await dappPage.url()
      expect(e, `1inch dapp UI not loading.....${pageTitle}...${pageUrl}`).equals(null)
    }
    await dappPage.waitForSelector("[data-id$='Ethereum']")
    await dappPage.click('.mat-checkbox-inner-container')
    await dappPage.click("[data-id$='Ethereum']")

    // Before click on injected wallet option.
    const newPagePromise = new Promise(x => browser.once('targetcreated', target => x(target.page()))) /* eslint-disable-line */
    await dappPage.click("[data-id$='Web3']")
    const connectRequestWindow = await newPagePromise
    await connectRequestWindow.waitForSelector('#ETHEREUM', { visible: true })
    await connectRequestWindow.click('#ETHEREUM')
    // Check connect button is enabled
    await connectRequestWindow.click('#connect_request_button').catch(e => e)
    // Check web3 status as connected
    await dappPage.waitForSelector("[class$='account-button ng-star-inserted']", { visible: true })
  })
  it.skip('1Inch injection - Polygon', async () => {
    // Select polygon network
    await page.click('#dropdown-item')
    await page.waitForSelector('#polygon_web_network', { visible: true })
    await page.click('#polygon_web_network')

    // Go to 1inch app
    const dappPage = await browser.newPage()
    await dappPage.goto('https://app.1inch.io/', { timeout: 60000 })
    try {
      await dappPage.waitForSelector('[data-id$="header.connect-wallet-button"]', { visible: true, timeout: 60000 })
    } catch (e) {
      await dappPage.screenshot({ path: 'screenshots/1inch-dapp-load-issue.png', fullscreen: true })
      const pageTitle = await dappPage.title()
      const pageUrl = await dappPage.url()
      expect(e, `1inch dapp UI not loading.....${pageTitle}...${pageUrl}`).equals(null)
    }
    // Change to polygon from 1inch
    await dappPage.waitForSelector('[data-id*="connect-wallet-button"]', { visible: true })
    await dappPage.click("[data-id$='header.switch-network-button']")
    await dappPage.click("[data-id$='Polygon Network']")
    await dappPage.waitForTimeout(5000)

    await dappPage.click('[data-id$="header.connect-wallet-button"]')
    await dappPage.waitForSelector("[data-id$='Ethereum']")
    await dappPage.click('.mat-checkbox-inner-container')
    await dappPage.click("[data-id$='Polygon Network']")

    // Before click on injected wallet option.
    const newPagePromise = new Promise(x => browser.once('targetcreated', target => x(target.page()))) /* eslint-disable-line */
    await dappPage.click("[data-id$='Web3']")
    const connectRequestWindow = await newPagePromise
    await connectRequestWindow.waitForSelector('#POLYGON', { visible: true })
    await connectRequestWindow.click('#POLYGON')
    // Check connect button is enabled
    await connectRequestWindow.click('#connect_request_button').catch(e => e)

    // Check web3 status as connected
    await dappPage.waitForSelector("[class$='account-button ng-star-inserted']", { visible: true })
  })
  it.skip('1Inch injection - BSC', async () => {
    // Select polygon network
    await page.click('#dropdown-item')
    await page.waitForSelector('#bsc_web_network', { visible: true })
    await page.click('#bsc_web_network')

    // Go to 1inch app
    const dappPage = await browser.newPage()
    await dappPage.goto('https://app.1inch.io/')
    // Change to BSC
    await dappPage.waitForSelector('[data-id*="connect-wallet-button"]', { visible: true })
    await dappPage.click("[data-id$='header.switch-network-button']")
    await dappPage.click("[data-id$='BSC Mainnet']")
    await dappPage.waitForTimeout(2000)

    await dappPage.click('[data-id*="connect-wallet-button"]')
    await dappPage.waitForSelector("[data-id$='Ethereum']")
    await dappPage.click('.mat-checkbox-inner-container')
    await dappPage.waitForSelector("[data-id*='BSC']", { visible: true })
    await dappPage.click("[data-id*='BSC']")

    // Before click on injected wallet option.
    const newPagePromise = new Promise(x => browser.once('targetcreated', target => x(target.page()))) /* eslint-disable-line */
    await dappPage.click("[data-id$='Web3']")
    const connectRequestWindow = await newPagePromise
    await connectRequestWindow.waitForSelector('#BSC', { visible: true })
    await connectRequestWindow.click('#BSC')
    // Check connect button is enabled
    await connectRequestWindow.click('#connect_request_button').catch(e => e)

    // Check web3 status as connected
    await dappPage.waitForSelector("[class$='account-button ng-star-inserted']", { visible: true })
  })
})
