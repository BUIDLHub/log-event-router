export const schema = {
  type: "object",
  required: ['name', 'address', 'abi'],
  properties: {
    name: {
      type: 'string',
      title: 'Name',
      description: "Name of the contract"
    },
    address: {
      type: 'string',
      title: "Address",
      description: "Ethereum mainnet address"
    },
    abi: {
      type: 'string',
      title: "ABI",
      description: "If not publicly available, will need to provide ABI array"
    }
  }
}

export const uiSchema = {
  abi: {
    "ui:widget": "textarea"
  }
}
