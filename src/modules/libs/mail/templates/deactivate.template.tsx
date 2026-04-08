import * as React from 'react'
import { Html } from "@react-email/html"
import { Body, Head, Heading, Link, Preview, Section, Tailwind, Text } from "@react-email/components"
import type { SessionMetadata } from '../../../../shared/types/session-metadata.types'

interface DeactiavteTemplateProps {
    token: string
    metadata: SessionMetadata
}

export function DeactiavteTemplate({ token, metadata }: DeactiavteTemplateProps) {
    return (
        <Html>
            <Head />
            <Preview>Portfolio-Hub: Деактивация аккаунта</Preview>
            <Tailwind>
                <Body className='max-w-2xl mx-auto p-6 bg-slate-50'>
                    <Section className='text-center mb-8'>
                        <Heading className='text-3xl text-black font-bold'>Деактивация аккаунта</Heading>
                        <Text className='text-base text-black'>
                            Вы инициировали процесс деактивации вашего аккаунта на платформе <b>Portfolio-Hub</b>.
                        </Text>
                    </Section>
                    <Section className='bg-gray-100 rounded-lg p-6 text-center mb-6'>
                        <Heading className='text-2xl text-black font-semibold'>Код подтверждения: </Heading>
                        <Heading className='text-3xl text-black font-semibold'>{token}</Heading>
                        <Text>Этот код действителен в течении 5 минут.</Text>
                    </Section>
                    <Section className='bg-gray-100 rounded-lg p-6 mb-6'>
                        <Section className='ml-20'>
                            <Heading className='text-xl font-semibold text-[#18B9AE]'>Инфоррмация о запросе</Heading>
                            <ul className='list-disc list-inside mt-2 text-base text-black'>
                                <li>📍 Расположение: {metadata.location.country}, {metadata.location.city}</li>
                                <li>📱 Операционная система: {metadata.device.type}, {metadata.device.os}</li>
                                <li>🌍 Браузер: {metadata.device.browser}</li>
                                <li>💻 IP-адрес: {metadata.ip}</li>
                            </ul>
                            <Text className='text-gray-600 mt-2'>
                                Если вы не инициировали этот запрос. пожалуйста, игнорируйте это сообщение.
                            </Text>
                        </Section>
                    </Section>
                    <Section className='text-center'>
                        <Text className='text-gray-600'>
                            Если у вас есть вопросы или вы столкнулись с
                            трудностями, не стесняйтесь в нашу службу поддержки по адресу {' '}
                            <Link href='mailto:aristiktop8@gmail.com' className='text-[#18B9AE] underline'>
                                aristiktop8@gmail.com
                            </Link>
                        </Text>
                    </Section>
                </Body>
            </Tailwind>
        </Html>
    )
}
