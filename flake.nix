{
  description = "phyt dev env";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
  inputs.flake-utils.url = "github:numtide/flake-utils";
  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let pkgs = import nixpkgs {
        inherit system;
        config.allowUnfree = true;
      };
      in {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            pre-commit
            nodejs_22
            pnpm
            docker-compose
            go
            go-task
            foundry
            git
            jq
            yq
            python3
            vault
            cloudflared
            shellcheck
            shfmt
            tflint
            terraform
          ];
        };
      });
}
