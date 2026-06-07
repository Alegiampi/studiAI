import { z } from 'zod'

const roleEnum = z.enum(['user', 'assistant'])
const messageSchema = z.object({ role: roleEnum, text: z.string().max(10000) })

export const ChatSchema = z.object({
  messages: z.array(messageSchema).max(50),
  exercise: z.string().max(10000).optional(),
  explanation: z.string().max(50000).optional(),
})

export const ClassifySchema = z.object({
  text: z.string().max(10000),
  scuola: z.string().max(100).optional(),
  classe: z.string().max(100).optional(),
})

const tipoEnum = z.enum(['esercizio', 'chiarimento'])

export const ExplainSchema = z.object({
  text: z.string().max(10000),
  imageBase64: z.string().max(5000000).nullable().optional(),
  tipo: tipoEnum.nullable().optional().default('esercizio'),
  scuola: z.string().max(100).nullable().optional(),
  classe: z.string().max(100).nullable().optional(),
  materie: z.array(z.string().max(100)).max(20).nullable().optional(),
})

export const GraphSchema = z.object({
  esercizio: z.string().max(10000),
  spiegazione: z.string().max(50000),
})

export const GraphAssistSchema = z.object({
  prompt: z.string().max(5000),
  context: z.array(z.any()).optional().default([]),
})

export const ShareSchema = z.object({
  question: z.string().max(10000),
  explanation: z.string().max(50000),
  scuola: z.string().max(100).optional(),
  classe: z.string().max(100).optional(),
  grafico: z.any().optional(),
})

export const ExerciseCreateSchema = z.object({
  question: z.string().max(10000),
  explanation: z.string().max(50000),
  subject: z.string().max(100).optional(),
})

export const ExerciseUpdateSchema = z.object({
  id: z.string(),
  is_favorite: z.boolean().optional(),
  shared_id: z.string().max(50).optional(),
})

export const ProfileSchema = z.object({
  onboarding_done: z.boolean().optional(),
  scuola: z.string().max(100).optional(),
  classe: z.string().max(100).optional(),
  materie: z.array(z.string().max(100)).max(20).optional(),
})

export const CheckoutSchema = z.object({
  priceId: z.string().max(200),
})
