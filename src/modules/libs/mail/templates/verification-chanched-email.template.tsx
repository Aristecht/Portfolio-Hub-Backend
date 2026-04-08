import * as React from 'react'
import { Html } from "@react-email/html"
import { Body, Head, Heading, Link, Preview, Section, Tailwind, Text } from "@react-email/components"

interface VerificationTemplateProps {
  domain: string
  token: string
}

export function verificationNewEmailTemplate({ domain, token }: VerificationTemplateProps) {
  const verificationLink = `${domain}/account/verify-new-email?token=${token}`

  return (
    <Html>
      <Head />
      <Preview>Portfolio-Hub — подтверждение адреса электронной почты</Preview>
      <Tailwind>
        <Body className="max-w-2xl mx-auto p-6 bg-slate-50">
          <Section className="text-center mb-8">
            <Heading className="text-3xl text-black font-bold">
              Подтверждение адреса электронной почты
            </Heading>

            <Text className="text-base text-black mt-4">
              Вы указали этот адрес электронной почты при смене электронной почты в сервисе <b>Portfolio-Hub</b>.
              Чтобы завершить смену почты,
              нажмите кнопку ниже.
            </Text>

            <Link
              href={verificationLink}
              className="inline-flex justify-center items-center rounded-full text-sm font-medium text-white bg-[#18B9AE] px-6 py-2 mt-4"
            >
              Подтвердить почту
            </Link>

            <Text className="text-sm text-gray-600 mt-6">
              Если вы не создавали аккаунт в Portfolio-Hub, просто проигнорируйте это письмо —
              никаких действий от вас не требуется.
            </Text>
          </Section>

          <Section className="text-center">
            <Text className="text-gray-600 text-sm">
              Если возникли вопросы, свяжитесь с нашей службой поддержки:{' '}
              <Link
                href="mailto:aristiktop8@gmail.com"
                className="text-[#18B9AE] underline"
              >
                aristiktop8@gmail.com
              </Link>
            </Text>
          </Section>
        </Body>
      </Tailwind>
    </Html>
  )
}