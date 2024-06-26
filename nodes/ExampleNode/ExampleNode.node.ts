import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription, NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';

import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

function getInputs() {
	const inputs = [
		{ displayName: '', type: NodeConnectionType.Main },
		{
			displayName: 'Model',
			maxConnections: 20,
			type: NodeConnectionType.AiLanguageModel,
			required: true,
		},
	];

	// If `hasOutputParser` is undefined it must be version 1.3 or earlier so we
	// always add the output parser input
	// if (hasOutputParser === undefined || hasOutputParser === true) {
	// 	inputs.push({ displayName: 'Output Parser', type: NodeConnectionType.AiOutputParser });
	// }
	return inputs;
}
export class ExampleNode implements INodeType {

	description: INodeTypeDescription = {
		displayName: 'Example Node',
		name: 'exampleNode',
		group: ['transform'],
		version: 1,
		description: 'Basic Example Node',
		defaults: {
			name: 'Example Node',
		},
		// inputs: ['main'],
		inputs: `={{ ((parameter) => { ${getInputs.toString()}; return getInputs(parameter) })($parameter) }}`,
		outputs: ['main'],
		properties: [
			{
				displayName: 'My String',
				name: 'myString',
				type: 'string',
				default: '',
				placeholder: 'Placeholder value',
				description: 'The description text',
			},
		],
	};



	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		let item: INodeExecutionData;
		let myString: string;

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				myString = this.getNodeParameter('myString', itemIndex, '') as string;
				item = items[itemIndex];
				myString = myString;

				// Calling python function
				const { stdout } = await execPromise('python sample.py');
				// if (error) {
				// 	console.error(`exec error: ${error}`);
				// 	return;
				// }

				console.log(`Result from Python Script: ${stdout}`);

				// Assume that your Python function returns a string that you
				// want to add to the json object.
				item.json['myString3'] = stdout;

			} catch (error) {
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {
					if (error.context) {
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return this.prepareOutputData(items);
	}
}
