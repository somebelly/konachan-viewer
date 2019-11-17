import os, eel
from datetime import date, timedelta
from random import randint, choice
from requests_html import HTMLSession

eel.init('web')
session = HTMLSession()


def random_date(start=date(2008, 1, 13), end=date.today()):
    size = (end - start).days
    return start + timedelta(days=randint(randint(0, size), size))


def get_random_image_url():
    d = random_date()
    return choice(
        session.get(
            f"https://konachan.com/post/popular_by_day?day={d.day}&month={d.month}&year={d.year}"
        ).html.find(".directlink.largeimg")).links.pop()


def save_image(url):
    try:
        img = session.get(url).content
        open(os.path.join('web', 'image'), 'wb').write(img)
    except Exception as e:
        print(e)


@eel.expose
def load(seconds=3):
    eel.sleep(seconds / 2)
    save_image(get_random_image_url())
    eel.sleep(seconds / 2)


load()
eel.start('index.html')
