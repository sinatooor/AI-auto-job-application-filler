import { TextInput } from './TextInput'

const inputs = [
    TextInput,
    // Add other inputs here as we implement them (Textarea, File, etc.)
]

export const RegisterInputs = async (node: Node = document) => {
    Promise.all(inputs.map((i) => i.autoDiscover(node)))
}
