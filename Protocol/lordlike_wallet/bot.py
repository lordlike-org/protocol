import logging

from telegram import Update
from telegram.ext import CommandHandler, CallbackQueryHandler, Application, ContextTypes

from lordlike_wallet.config import BOT_TOKEN
from lordlike_wallet.handlers.start import start, settings, tutorial

# from start import start, settings, tutorial
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

TOKEN = BOT_TOKEN


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await start(update, context)


async def settings_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await settings(update, context)


async def tutorial_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await tutorial(update, context)


def main() -> None:
    """Launching bot."""
    application = Application.builder().token(TOKEN).build()

    # Adding compendiums
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CallbackQueryHandler(settings_callback, pattern='settings'))
    application.add_handler(CallbackQueryHandler(tutorial_callback, pattern='tutorial'))

    # Launching bot
    application.run_polling()


if __name__ == '__main__':
    main()
