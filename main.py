import tkinter as tk
import pyttsx3

root = tk.Tk()
root.geometry("700x300")

title = tk.Label(text="Transform any piece of text into an audio")
title.pack()

text = tk.Text(root, height=10, width=50, font=('Arial', 20))
text.pack()

def turn_into_audio():
    engine = pyttsx3.init()
    engine.say(text.get('1.0', tk.END))
    engine.runAndWait()

button = tk.Button(root, command=turn_into_audio, text="Turn into audio")
button.pack()

root.mainloop()
