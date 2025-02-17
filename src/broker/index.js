import VuexPersist from 'vuex-persist'
import { omit } from 'lodash-es'

import Background from './Background'
import Foreground from './Foreground'
import { isBackgroundScript } from './utils'
import Storage from './Storage'
import { migrations } from '@liquality/wallet-core'

const { isMigrationNeeded, processMigrations } = migrations

const Broker = (state) => {
  if (isBackgroundScript(window)) {
    const vuexPersist = new VuexPersist({
      key: 'liquality-wallet',
      storage: Storage,
      asyncStorage: true,
      reducer: (state) => {
        return {
          ...omit(state, ['key', 'wallets', 'unlockedAt', 'app']),
          app: {
            locale: state.app?.locale
          }
        }
      }
    })

    /**
     * Hook into vuex-persist `restoreState` to run migrations on state
     * This happens before the plugin restores the state from chrome storage.
     */
    const restoreState = vuexPersist.restoreState
    vuexPersist.restoreState = async (key, storage) => {
      const currentState = await Storage.getItem('liquality-wallet')
      if (currentState && isMigrationNeeded(currentState)) {
        const newState = await processMigrations(currentState)
        await Storage.setItem('liquality-wallet', newState)
      }
      const state = await restoreState(key, storage)
      vuexPersist.restoreState = restoreState // Remove hook
      return state
    }

    return {
      plugin: (store) => {
        vuexPersist.plugin(store)
        return new Background(store)
      },
      state
    }
  }

  return {
    plugin: (store) => new Foreground(store),
    state: {}
  }
}

export default Broker
