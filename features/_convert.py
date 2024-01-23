from pathlib import Path
from typing import TypedDict, Literal
import sys


from gherkin.parser import Parser

class Location(TypedDict):
    line: int
    column: int


class Base(TypedDict):
    tags: list[str]
    keyword: str
    name: str
    location: Location
    description: str


class Step(TypedDict):
    id: str
    location: Location
    keyword: list[str]
    keywordType: Literal['Context', 'Action', 'Outcome']
    text: str


class Scenario(Base):
    id: str
    examples: list[str]
    steps: list[Step]


class ScenarioDict(TypedDict):
    scenario: Scenario


class Feature(Base):
    language: str
    children: list[ScenarioDict]


class Comment(TypedDict):
    location: Location
    text: str


class ParsedAST(TypedDict):
    feature: Feature
    comments: list[Comment]



def gherkin_to_markdown(gherkin_text):
    parser = Parser()
    feature: ParsedAST = parser.parse(gherkin_text)

    ret_text: list[str] = []

    f = feature['feature']

    feature_name = f['name']

    ret_text.append(f['description'].strip())

    for scenario in f['children']:
        s = scenario['scenario']
        ret_text.append(
            f"### {s['name']}"
        )
        for step in s['steps']:
            verb = step['keywordType']
            if verb == "Context":
                verb = "Given"
            if verb == "Action":
                verb = "When"
            if verb == "Outcome":
                verb = "Then"
            
            ret_text.append(
                f"- **{verb}** {step['text']}"
            )
        
        ret_text.append(
            f"- [ ] Works"
        )
            
    return (
        """<details>"""
        + f"""<summary>{feature_name}</summary>"""
        + "\n\n"
        + '\n\n'.join(ret_text)
        + "\n\n"
        + """</details>"""
        + "\n\n"
        + "- [ ] All Checked"
        + "\n\n"
        + "---"
        + "\n\n"
    )


def main(output: str="./e2e/checklist.md"):
    
    path_to_feature = Path("features")
    markdown_txt = """# Staging Checklist

**use incognito browser**

[homepage](https://atlases.ebrains.eu/viewer-staging/)

"""
    for f in path_to_feature.iterdir():
        if f.suffix != ".feature":
            continue
        text = f.read_text()
        markdown_txt += gherkin_to_markdown(text)
    
    with open(output, "w") as fp:
        fp.write(markdown_txt)
        

if __name__ == "__main__":
    main(*sys.argv[1:])
