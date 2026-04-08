import * as React from 'react'
import { Html } from "@react-email/html"
import { Body, Head, Heading, Link, Preview, Section, Tailwind, Text } from "@react-email/components"


interface AccountDeletionTemplateProps {
    domain: string
}

export function AccountDeletionTemplate({ domain }: AccountDeletionTemplateProps) {

    const registerLink = `${domain}/account/create`
    
    return (
        <Html>
            <Head />
            <Preview>Portfolio-Hub: Аккаунт удален</Preview>
            <Tailwind>
                <Body className='max-w-2xl mx-auto p-6 bg-slate-50'>
                    <Section className='text-center mb-6'>
                        <Heading className='text-3xl text-black font-bold'>Ваш аккаунт был полностью удален</Heading>
                        <Text className='text-base text-black mt-2'>
                            Ваш аккаунт был полностью стерт из базы данных Portfolio-Hub.
                            Все ваши данные и информация были удалены безвозратно.
                        </Text>
                    </Section>
                    <Section className='bg-white text-black flex justify-center text-center rounded shadow-md p-6 mb-4'>
                        <Text>Вы больше не будете получать уведомления в Telegram и на почту.</Text>
                        <Text>Если вы хотите зарегистрироваться на платформу, вы можете зарегистрироваться по следующей ссылке: </Text>
                        <Link href={registerLink} className='inline-flex justify-center items-center rounded-md mt-2 text-sm font-medium text-white bg-[#18B9AE] px-5 py-2 rounded-full'>Зарегестрироваться на Portfolio-Hub</Link>
                    </Section>
                    
                    <Section className='text-center text-black'>
                        <Text>
                            Спасибо, что были с нами! Мы всегда будем рады видеть вас на платформе.
                        </Text>
                    </Section>
                </Body>
            </Tailwind>
        </Html>
    )
}
