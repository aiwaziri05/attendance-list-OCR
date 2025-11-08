import { GoogleGenAI, Type } from "@google/genai";
import type { AttendanceRecord } from '../types';

// FIX: Per coding guidelines, initialize GoogleGenAI directly with process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING },
            firstname: { type: Type.STRING },
            middle: { type: Type.STRING },
            lastname: { type: Type.STRING },
            sex: { type: Type.STRING },
            do_you_have_any_disability: { type: Type.STRING },
            if_yes_type_of_disability: { type: Type.STRING },
            home_address: { type: Type.STRING },
            phone_no: { type: Type.STRING },
            email: { type: Type.STRING },
            highest_qualification: { type: Type.STRING },
            employment_type: { type: Type.STRING },
            employment_status: { type: Type.STRING },
        },
        required: [
            "id", "firstname", "lastname", "sex", "home_address", "phone_no", "email"
        ]
    }
};

const prompt = `
Analyze the provided image of an attendance sheet with high accuracy.
Perform Optical Character Recognition (OCR) to identify and extract all tabular data.
Structure the extracted information into a JSON array of objects, strictly adhering to the provided schema.

The columns are:
- id: The unique identifier for the row.
- firstname: The first name of the person.
- middle: The middle name. Can be empty.
- lastname: The last name of the person.
- sex: The gender, usually 'M' or 'F'.
- do_you_have_any_disability: 'Yes' or 'No'.
- if_yes_type_of_disability: The type of disability if applicable. Can be empty.
- home_address: The full home address.
- phone_no: The phone number.
- email: The email address.
- highest_qualification: The highest academic qualification.
- employment_type: The type of employment listed in the document. Extract this value directly from the 'Employment Type' column.
- employment_status: This should be left empty.

Key Instructions:
1.  **Accuracy is critical**: Double-check extracted text for common OCR errors. Pay close attention to names, addresses, emails, and phone numbers.
2.  **Column Mapping**: Correctly map the data from the image columns to the corresponding JSON fields. The image has columns like 'Qualification' and 'Employment Type'. Map 'Qualification' to 'highest_qualification' and 'Employment Type' to 'employment_type'.
3.  **Employment Status**: Leave the 'employment_status' field as an empty string ("") for all records. The user will fill this in manually.
4.  **Empty Values**: If a value is missing for any field in a row (except for required ones), represent it as an empty string ("").
5.  **Output Format**: Ensure the final output is ONLY the raw JSON data, with no surrounding text, markdown formatting (like \`\`\`json), or explanations.
`;

export async function extractDataFromImage(base64Image: string, mimeType: string): Promise<AttendanceRecord[]> {
    try {
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: mimeType,
            },
        };

        const textPart = {
            text: prompt,
        };
        
        // FIX: Reordered parts to place the image before the text prompt, as recommended for multimodal inputs.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        
        const jsonString = response.text;

        if (!jsonString) {
             throw new Error("API returned an empty response.");
        }
        
        const parsedData = JSON.parse(jsonString);
        return parsedData as AttendanceRecord[];
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to extract data. The document might not be clear or in a supported format.");
    }
}