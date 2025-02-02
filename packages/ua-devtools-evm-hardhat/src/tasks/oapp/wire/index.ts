import { task } from 'hardhat/config'
import type { ActionType } from 'hardhat/types'
import { SUBTASK_LZ_OAPP_WIRE_CONFIGURE, TASK_LZ_OAPP_WIRE } from '@/constants/tasks'
import { createLogger, setDefaultLogLevel, printJson, pluralizeNoun } from '@layerzerolabs/io-devtools'
import { OAppOmniGraph } from '@layerzerolabs/ua-devtools'
import { types, SUBTASK_LZ_SIGN_AND_SEND } from '@layerzerolabs/devtools-evm-hardhat'
import { OmniTransaction } from '@layerzerolabs/devtools'
import { printLogo } from '@layerzerolabs/io-devtools/swag'
import { validateAndTransformOappConfig } from '@/utils/taskHelpers'
import type { SignAndSendResult } from '@layerzerolabs/devtools'
import type { SubtaskConfigureTaskArgs } from './subtask.configure'
import type { SignAndSendTaskArgs } from '@layerzerolabs/devtools-evm-hardhat/tasks'

import './subtask.configure'

interface TaskArgs {
    oappConfig: string
    logLevel?: string
    ci?: boolean
}

const action: ActionType<TaskArgs> = async (
    { oappConfig: oappConfigPath, logLevel = 'info', ci = false },
    hre
): Promise<SignAndSendResult> => {
    printLogo()

    // We'll set the global logging level to get as much info as needed
    setDefaultLogLevel(logLevel)

    // And we'll create a logger for ourselves
    const logger = createLogger()
    const graph: OAppOmniGraph = await validateAndTransformOappConfig(oappConfigPath, logger)

    // At this point we are ready to create the list of transactions
    logger.verbose(`Creating a list of wiring transactions`)

    // We'll get the list of OmniTransactions using a subtask to allow for developers
    // to use this as a hook and extend the configuration
    const transactions: OmniTransaction[] = await hre.run(SUBTASK_LZ_OAPP_WIRE_CONFIGURE, {
        graph,
    } satisfies SubtaskConfigureTaskArgs)

    // Flood users with debug output
    logger.verbose(`Created a list of wiring transactions`)
    logger.debug(`Following transactions are necessary:\n\n${printJson(transactions)}`)

    // If there are no transactions that need to be executed, we'll just exit
    if (transactions.length === 0) {
        logger.info(`The OApp is wired, no action is necessary`)

        return [[], [], []]
    }

    // Tell the user about the transactions
    logger.info(
        pluralizeNoun(
            transactions.length,
            `There is 1 transaction required to configure the OApp`,
            `There are ${transactions.length} transactions required to configure the OApp`
        )
    )

    // Now sign & send the transactions
    const signAndSendResult = await hre.run(SUBTASK_LZ_SIGN_AND_SEND, {
        transactions,
        ci,
    } satisfies SignAndSendTaskArgs)

    return signAndSendResult
}

task(TASK_LZ_OAPP_WIRE, 'Wire LayerZero OApp', action)
    .addParam('oappConfig', 'Path to your LayerZero OApp config', undefined, types.string)
    .addParam('logLevel', 'Logging level. One of: error, warn, info, verbose, debug, silly', 'info', types.logLevel)
    .addFlag('ci', 'Continuous integration (non-interactive) mode. Will not ask for any input from the user')
