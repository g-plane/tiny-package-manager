workflow "Test" {
  on = "push"
  resolves = ["Linting"]
}

action "Linting" {
  uses = "docker://node:8-alpine"
  runs = "npm i && npm t"
}
