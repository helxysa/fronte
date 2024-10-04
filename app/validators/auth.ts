import vine from '@vinejs/vine'

const password = vine.string().minLength(8)

export const registerValidator = vine.compile(
  vine.object({
    nome: vine.string(),
    cargo: vine.string(),
    setor: vine.string(),
    email: vine
      .string()
      .email()
      .unique(async (db, value) => {
        const match = await db.from('users').select('id').where('email', value).first()
        return !match
      }),
    profile_id: vine.number().exists(async (db, value) => {
      const match = await db.from('profiles').select('id').where('id', value).first()
      return !!match
    }),
  })
)

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    password,
  })
)
