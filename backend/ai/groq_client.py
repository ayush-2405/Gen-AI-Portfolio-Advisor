# ai/groq_client.py

import os
from groq import Groq


class GroqClient:

    def __init__(self, api_key=None):

        self.client = Groq(

            api_key=api_key or os.getenv("GROQ_API_KEY")

        )

    def chat(

        self,

        system,

        user,

        model="llama-3.3-70b-versatile",

        temperature=0.2,

    ):

        response = self.client.chat.completions.create(

            model=model,

            temperature=temperature,

            messages=[

                {

                    "role": "system",

                    "content": system,

                },

                {

                    "role": "user",

                    "content": user,

                },

            ],

        )

        return response.choices[0].message.content