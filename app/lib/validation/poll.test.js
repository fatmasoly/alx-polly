import test from 'node:test'
import assert from 'node:assert/strict'
import { validatePollInput } from './poll.js'

test('validatePollInput accepts valid input', () => {
  const result = validatePollInput({
    question: 'Best language?',
    options: ['JavaScript', 'Python']
  })
  assert.equal(result.success, true)
})

test('validatePollInput rejects duplicate options', () => {
  const result = validatePollInput({
    question: 'Pick one',
    options: ['JS', 'js']
  })
  assert.equal(result.success, false)
  assert.ok(result.error.includes('unique'))
})

test('validatePollInput enforces min options', () => {
  const result = validatePollInput({
    question: 'Pick one',
    options: ['Only one']
  })
  assert.equal(result.success, false)
})


