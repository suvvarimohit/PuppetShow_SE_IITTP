# OPEN-SOURCE REQUIREMENT

## 1. Mandatory Open-Source Development

The project must follow an open-source development approach. The source code and project documentation must be maintained in a publicly accessible GitHub repository.

The following requirements must be followed:

1. The project source code must be publicly accessible through GitHub.
2. All project documentation, including the SRS, feasibility study, and project constraints, must be maintained in the repository.
3. The project should prioritise open-source tools, frameworks, libraries, and technologies wherever possible.
4. Any third-party libraries, datasets, images, or other resources must comply with their respective licences.
5. External APIs and services used in the project must be properly documented.
6. API keys, passwords, and confidential credentials must never be uploaded to the public repository.
7. Project development and updates should be tracked using Git commits.
8. The repository should include setup instructions so that other developers can clone, install, run, and contribute to the project.

**Note:** If external services such as Google Gemini are used, the project source code must remain accessible, while the use of external APIs and their applicable terms or limitations must be documented.

---

# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

## Traditional Indian Puppet Show Generation System

### 1. Project Overview

The Traditional Indian Puppet Show Generation System is a web-based application that converts user-provided stories into digital puppet shows.

The user enters a story or uploads a text file. The system analyses the story using AI to identify characters, classify their roles, extract dialogues, and divide the story into scenes. Based on this information, the application creates or selects suitable traditional Indian puppet characters, displays their actions through animation, and aims to generate a complete puppet-show video.

The main objective is to simplify puppet-show creation while promoting traditional Indian puppetry through modern technology.

### 2. User Stories

| ID    | User Story                                                                                                                                                           |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US-01 | As a user, I want to enter or upload a story so that I can convert it into a puppet show.                                                                            |
| US-02 | As a user, I want the system to analyse my story automatically so that I do not have to manually prepare the characters and scenes.                                  |
| US-03 | As a user, I want the system to identify all the characters in my story so that each character can be represented by a puppet.                                       |
| US-04 | As a user, I want the system to classify characters as heroes, villains, helpers, narrators, and supporting characters so that their roles are understood correctly. |
| US-05 | As a user, I want the system to identify each character's personality and appearance so that suitable puppet designs can be created.                                 |
| US-06 | As a user, I want the system to extract dialogues for individual characters so that each puppet can speak its assigned lines.                                        |
| US-07 | As a user, I want the system to divide my story into scenes so that the puppet show follows the correct story sequence.                                              |
| US-08 | As a user, I want suitable backgrounds and props to be selected for each scene so that the puppet show visually represents the story.                                |
| US-09 | As a user, I want traditional Indian-style puppet characters to be generated or selected so that the show reflects Indian puppetry traditions.                       |
| US-10 | As a user, I want the same character to maintain a consistent appearance across different scenes so that the story looks continuous.                                 |
| US-11 | As a user, I want the puppets to perform actions such as walking, talking, and moving so that the story becomes animated.                                            |
| US-12 | As a user, I want different voices to be assigned to different characters so that the puppet show feels more realistic.                                              |
| US-13 | As a user, I want the dialogue audio to match the corresponding character and scene so that the animation and speech remain synchronised.                            |
| US-14 | As a user, I want to preview the generated puppet show so that I can check the output.                                                                               |
| US-15 | As a user, I want to play, pause, resume, and restart the puppet show so that I can control its playback.                                                            |
| US-16 | As a user, I want to export the completed puppet show as an MP4 video so that I can save and share it.                                                               |
| US-17 | As a user, I want to receive clear error messages when something goes wrong so that I understand what needs to be corrected.                                         |

### 3. Use Cases

#### UC-01: Submit Story

**Primary Actor:** User

**Description:** The user provides a story to the application.

**Preconditions:** The application is accessible.

**Main Flow:**

1. The user opens the application.
2. The user enters a story in the text area or uploads a text file.
3. The user clicks the Submit or Generate button.
4. The system checks whether the story is valid.
5. The system sends the story to the backend for processing.

**Alternative Flow:**

- If the story is empty, the system displays an error message.
- If the uploaded file is unsupported, the system asks the user to provide a valid file.

**Postcondition:** The story is successfully submitted for analysis.

#### UC-02: Analyse Story and Identify Characters

**Primary Actor:** User

**Supporting Actor:** AI Service

**Description:** The system analyses the story and identifies its characters and their roles.

**Preconditions:** A valid story has been submitted.

**Main Flow:**

1. The backend receives the story.
2. The system sends the story to the AI service.
3. The AI analyses the story.
4. The system identifies the characters.
5. The system classifies their roles, such as hero, villain, helper, or supporting character.
6. The system extracts their personalities, appearances, and dialogues.
7. The results are returned in a structured format.

**Alternative Flow:**

- If the AI service is unavailable, the system displays an error.
- If the response is incomplete or invalid, the system handles the error and allows the operation to be retried.

**Postcondition:** Character information is available for puppet-show generation.

#### UC-03: Generate Scenes and Puppet Characters

**Primary Actor:** User

**Supporting Actor:** AI Processing Component

**Description:** The system prepares scenes and suitable puppet characters based on the analysed story.

**Preconditions:** Story analysis and character identification are completed.

**Main Flow:**

1. The system divides the story into scenes.
2. It identifies the characters appearing in each scene.
3. It determines suitable backgrounds and props.
4. It selects or generates traditional Indian-style puppet characters.
5. It associates the characters and backgrounds with their respective scenes.

**Alternative Flow:**

- If a suitable puppet asset is unavailable, the system uses an available alternative or reports that the asset is missing.

**Postcondition:** The scenes are prepared with their associated characters and visual elements.

#### UC-04: Generate and Preview Puppet Show

**Primary Actor:** User

**Description:** The system animates the scenes and allows the user to preview the puppet show.

**Preconditions:** Scene information and puppet characters are available.

**Main Flow:**

1. The animation engine loads the required characters and backgrounds.
2. The system displays the scenes in the correct sequence.
3. Characters perform their assigned actions.
4. Dialogue audio is played when available.
5. The user selects Play to view the puppet show.
6. The user can pause, resume, or restart playback.

**Alternative Flow:**

- If an animation asset is unavailable, the system displays an appropriate fallback or error message.

**Postcondition:** The user can preview the generated puppet show.

#### UC-05: Export Puppet Show as Video

**Primary Actor:** User

**Description:** The user exports the generated puppet show as an MP4 video.

**Preconditions:** The puppet-show sequence is generated and video export is available.

**Main Flow:**

1. The user selects the Export Video option.
2. The system combines the animated scenes and dialogue audio.
3. The system processes the output into MP4 format.
4. The generated video is made available to the user.
5. The user saves the video.

**Alternative Flow:**

- If video processing fails, the system displays an error and allows the user to retry.

**Postcondition:** The user receives the generated MP4 video.

### 4. Expected System Workflow

1. User enters or uploads a story.
2. AI analyses the story.
3. Characters are identified and classified.
4. Character descriptions and dialogues are extracted.
5. The story is divided into scenes.
6. Puppet characters, backgrounds, and props are selected or generated.
7. The animation engine creates the puppet-show sequence.
8. Character voices are generated and synchronised.
9. The user previews the puppet show.
10. The completed show is exported as an MP4 video.

### 5. Scope of the Proposed System

The system focuses on automating the transformation of textual stories into traditional Indian-style digital puppet shows. The existing prototype provides the foundation for story input and browser-based puppet animation. AI-based story analysis and the remaining generation and export capabilities are intended to extend this prototype into a complete automated system.
