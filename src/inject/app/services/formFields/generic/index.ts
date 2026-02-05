import { TextInput } from './TextInput'
import { Textarea } from './Textarea'
import { Select } from './Select'
import { Checkbox } from './Checkbox'
import { Radio } from './Radio'

const inputs = [
  TextInput,
  Textarea,
  Select,
  Checkbox,
  Radio,
]

/**
 * Register generic form field handlers for any website.
 * This is a fallback when no specific site handler is available.
 */
export const RegisterInputs = async (node: Node = document) => {
  await Promise.all(inputs.map((i) => i.autoDiscover(node)))
}
