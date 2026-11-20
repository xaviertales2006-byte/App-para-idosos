# App de Inclusão Digital para Idosos

Projeto de Extensão: Inclusão Digital & Suporte Técnico Comunitário.

## Rodar no celular

```bash
npm install
npx expo install --fix   # alinha as versões das dependências ao SDK do Expo
npx expo start
```

Abra o app **Expo Go** no celular e leia o QR code.

## Gerar o APK (EAS Build)

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

O terminal mostra o link para baixar o `.apk` ao final.

## Abas

- 🚗 Corrida: escolhe o destino e abre o WhatsApp com a mensagem pronta
- 🛡️ Golpes: dicas e quiz "Isto é golpe?"
- 📖 Guia: cartilha digital passo a passo
- 🆘 Ajuda: emergência, família, tamanho da letra e modo cuidador

## Configurar antes de usar

Na aba **Ajuda → Modo cuidador**, cadastre o WhatsApp da central/motorista
(com DDI e DDD, ex.: `5592999999999`), o telefone de um familiar e os destinos.
Tudo fica salvo no aparelho.
